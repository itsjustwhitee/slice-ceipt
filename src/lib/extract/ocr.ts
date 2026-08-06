import { base } from '$app/paths';
import { preprocessForOcr } from './image-preprocess';

/**
 * Runs the receipt photo through `preprocessForOcr` (grayscale + contrast
 * stretch — see that function's doc comment) before handing it to
 * Tesseract, via an off-DOM canvas. Falls back to the original, unprocessed
 * image on any failure (an unusual browser/canvas quirk, a corrupt image,
 * etc.) rather than blocking extraction entirely over what's purely a
 * quality-of-read improvement, not a correctness requirement.
 */
async function preprocessImage(image: File | Blob): Promise<File | Blob> {
	try {
		const bitmap = await createImageBitmap(image);
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return image;

		ctx.drawImage(bitmap, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		preprocessForOcr(imageData.data);
		ctx.putImageData(imageData, 0, 0);

		return await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(result) => (result ? resolve(result) : reject(new Error('canvas.toBlob failed'))),
				'image/png'
			);
		});
	} catch {
		return image;
	}
}

/**
 * `onProgress` only fires for Tesseract's `recognizing text` stage (the
 * actual OCR pass, and by far the slowest part) — earlier stages
 * (loading the WASM core/language data) each report their own 0-1
 * progress independently, so forwarding those too would make the bar
 * visibly jump backward each time a new stage starts.
 *
 * `onConfidence`, when given, is called once with Tesseract's own overall
 * mean confidence for the recognized text (0-100 — low values mean the
 * photo was blurry/crumpled/badly lit enough that the OCR itself doesn't
 * trust its own read). Surfacing this lets the UI nudge the user to
 * double-check the parsed items instead of silently trusting a bad scan.
 */
export async function extractTextFromImage(
	image: File | Blob,
	onProgress?: (fraction: number) => void,
	onConfidence?: (confidence: number) => void
): Promise<string> {
	const preprocessed = await preprocessImage(image);
	const { createWorker } = await import('tesseract.js');
	const worker = await createWorker(['eng', 'ita'], 1, {
		workerPath: `${base}/tesseract/worker.min.js`,
		corePath: `${base}/tesseract/core`,
		langPath: `${base}/tesseract/lang`,
		logger: (message) => {
			if (onProgress && message.status === 'recognizing text') onProgress(message.progress);
		}
	});
	const {
		data: { text, confidence }
	} = await worker.recognize(preprocessed);
	await worker.terminate();
	onConfidence?.(confidence);
	return text;
}
