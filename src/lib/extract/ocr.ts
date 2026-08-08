import { base } from '$app/paths';
import { preprocessForOcr } from './image-preprocess';

/** Grayscale + contrast-stretch before OCR; falls back to the original image on any failure. */
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
		preprocessForOcr(imageData.data, imageData.width, imageData.height);
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

// Tested against real photos: applying the contrast preprocessing
// unconditionally regressed some already-decent scans (it erased a thin
// but genuine minus sign entirely on one, and washed out two otherwise-
// readable prices on another) while clearly helping already-bad ones. So
// it's only used as a retry when the first, unprocessed pass comes back
// under this confidence — the same regime it was actually shown to help
// in, rather than a blanket "always enhance" that risks making a fine
// photo worse.
const RETRY_WITH_PREPROCESSING_BELOW_CONFIDENCE = 65;

/**
 * `onProgress` only fires for Tesseract's `recognizing text` stage, to
 * avoid the bar jumping backward when earlier stages report their own 0-1
 * — note that a low-confidence retry (see above) means this stage, and so
 * `onProgress`, can fire a second time.
 * `onConfidence`, when given, is called once with the best of the (one or
 * two) attempts' confidence, so the UI can flag a low-quality scan.
 */
export async function extractTextFromImage(
	image: File | Blob,
	onProgress?: (fraction: number) => void,
	onConfidence?: (confidence: number) => void
): Promise<string> {
	const { createWorker } = await import('tesseract.js');
	const worker = await createWorker(['eng', 'ita'], 1, {
		workerPath: `${base}/tesseract/worker.min.js`,
		corePath: `${base}/tesseract/core`,
		langPath: `${base}/tesseract/lang`,
		logger: (message) => {
			if (onProgress && message.status === 'recognizing text') onProgress(message.progress);
		}
	});

	const first = await worker.recognize(image);
	if (first.data.confidence >= RETRY_WITH_PREPROCESSING_BELOW_CONFIDENCE) {
		await worker.terminate();
		onConfidence?.(first.data.confidence);
		return first.data.text;
	}

	const preprocessed = await preprocessImage(image);
	const second = await worker.recognize(preprocessed);
	await worker.terminate();

	const best = second.data.confidence >= first.data.confidence ? second.data : first.data;
	onConfidence?.(best.confidence);
	return best.text;
}
