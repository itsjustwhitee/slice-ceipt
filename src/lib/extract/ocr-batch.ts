import { extractTextFromImage as defaultExtractTextFromImage } from './ocr';

type ExtractImageFn = (image: Blob | File, onProgress?: (fraction: number) => void) => Promise<string>;

/**
 * OCRs each image concurrently and joins the resulting text with `\n`.
 * Progress is the average of each image's own 0-1 progress, reported on
 * every update, rather than jumping per-image as each one finishes. Used
 * for both multi-page scanned PDFs (`extractReceiptText`) and user
 * multi-photo batches (`loadReceiptFromPhotos`).
 */
export async function extractTextFromImages(
	images: (Blob | File)[],
	extractTextFromImage: ExtractImageFn = defaultExtractTextFromImage,
	onProgress: (fraction: number) => void = () => {}
): Promise<string> {
	const progress = new Array(images.length).fill(0);
	const reportAverage = () => {
		onProgress(progress.reduce((sum, p) => sum + p, 0) / progress.length);
	};
	const texts = await Promise.all(
		images.map((image, i) =>
			extractTextFromImage(image, (fraction) => {
				progress[i] = fraction;
				reportAverage();
			})
		)
	);
	return texts.join('\n');
}
