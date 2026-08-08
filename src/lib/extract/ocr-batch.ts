import { extractTextFromImage as defaultExtractTextFromImage } from './ocr';

type ExtractImageFn = (
	image: Blob | File,
	onProgress?: (fraction: number) => void,
	onConfidence?: (confidence: number) => void
) => Promise<string>;

/**
 * OCRs each image concurrently and joins the resulting text with `\n`.
 * Progress is the average of each image's own 0-1 progress, reported on
 * every update, rather than jumping per-image as each one finishes.
 * `onConfidence`, when given, is called once with the average confidence
 * across all images.
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
			// Only pass a 3rd arg when needed — an explicit `undefined` still changes call arity.
			return onConfidence
				? extractTextFromImage(image, reportProgress, (confidence) => confidences.push(confidence))
				: extractTextFromImage(image, reportProgress);
		})
	);
	onConfidence?.(confidences.reduce((sum, c) => sum + c, 0) / confidences.length);
	return texts.join('\n');
}
