import { extractTextFromImage as defaultExtractTextFromImage } from './ocr';

type ExtractImageFn = (
	image: Blob | File,
	onProgress?: (fraction: number) => void,
	onConfidence?: (confidence: number) => void
) => Promise<string>;

/**
 * OCRs each image concurrently and joins the resulting text with `\n`.
 * Progress is the average of each image's own 0-1 progress, reported on
 * every update, rather than jumping per-image as each one finishes. Used
 * for both multi-page scanned PDFs (`extractReceiptText`) and user
 * multi-photo batches (`loadReceiptFromPhotos`).
 *
 * `onConfidence`, when given, is called once with the average of every
 * image's own OCR confidence (0-100) after all of them finish — a single
 * low-confidence page is as much a reason to double-check the result as a
 * uniformly mediocre batch, so a plain average (rather than e.g. the
 * minimum) is a reasonable one-number summary without over-engineering it.
 */
export async function extractTextFromImages(
	images: (Blob | File)[],
	extractTextFromImage: ExtractImageFn = defaultExtractTextFromImage,
	onProgress: (fraction: number) => void = () => {},
	onConfidence?: (confidence: number) => void
): Promise<string> {
	const progress = new Array(images.length).fill(0);
	const reportAverage = () => {
		onProgress(progress.reduce((sum, p) => sum + p, 0) / progress.length);
	};
	const confidences: number[] = [];
	const texts = await Promise.all(
		images.map((image, i) => {
			const reportProgress = (fraction: number) => {
				progress[i] = fraction;
				reportAverage();
			};
			// Only passed as a 3rd argument when actually needed — always
			// passing an explicit `undefined` there would still change the
			// call's arity, which breaks callers (and tests) asserting
			// exactly how `extractTextFromImage` was called.
			return onConfidence
				? extractTextFromImage(image, reportProgress, (confidence) => confidences.push(confidence))
				: extractTextFromImage(image, reportProgress);
		})
	);
	onConfidence?.(confidences.reduce((sum, c) => sum + c, 0) / confidences.length);
	return texts.join('\n');
}
