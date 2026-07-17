import { base } from '$app/paths';

export async function extractTextFromImage(image: File | Blob): Promise<string> {
	const { createWorker } = await import('tesseract.js');
	const worker = await createWorker(['eng', 'ita'], 1, {
		workerPath: `${base}/tesseract/worker.min.js`,
		corePath: `${base}/tesseract/core`,
		langPath: `${base}/tesseract/lang`
	});
	const {
		data: { text }
	} = await worker.recognize(image);
	await worker.terminate();
	return text;
}
