import { base } from '$app/paths';

/**
 * `onProgress` only fires for Tesseract's `recognizing text` stage (the
 * actual OCR pass, and by far the slowest part) — earlier stages
 * (loading the WASM core/language data) each report their own 0-1
 * progress independently, so forwarding those too would make the bar
 * visibly jump backward each time a new stage starts.
 */
export async function extractTextFromImage(
	image: File | Blob,
	onProgress?: (fraction: number) => void
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
	const {
		data: { text }
	} = await worker.recognize(image);
	await worker.terminate();
	return text;
}
