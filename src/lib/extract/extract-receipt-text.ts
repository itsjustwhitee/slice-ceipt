import { extractTextFromPdfTextLayer, renderPdfPagesToImages } from './pdf';
import { extractTextFromImage } from './ocr';

export interface ExtractDeps {
	extractTextFromPdfTextLayer: (data: ArrayBuffer) => Promise<string>;
	renderPdfPagesToImages: (data: ArrayBuffer) => Promise<Blob[]>;
	extractTextFromImage: (image: Blob | File) => Promise<string>;
}

const defaultDeps: ExtractDeps = {
	extractTextFromPdfTextLayer,
	renderPdfPagesToImages,
	extractTextFromImage
};

// Below this many characters, a PDF's text layer is treated as effectively
// empty (a scanned PDF sometimes still carries a stray character or two of
// embedded text, e.g. from a watermark) — short-circuiting straight to OCR
// in that case would be wrong just as often as accepting near-nothing as
// "real" text, so this threshold picks a practical middle ground.
const MIN_MEANINGFUL_TEXT_LENGTH = 20;

/**
 * Extracts raw text from a receipt file, ready to hand to
 * `parseReceiptText` from `$lib/parsing`. PDFs try the embedded text layer
 * first (fast, exact); if that comes back empty or near-empty (a scanned
 * PDF with no text layer), each page is rendered to an image and OCR'd
 * instead. Any other file type is treated as a photo and OCR'd directly.
 *
 * `deps` is injectable so this branching logic can be unit-tested without
 * real PDF/OCR execution — production code should never need to pass it.
 */
export async function extractReceiptText(
	file: File,
	deps: ExtractDeps = defaultDeps
): Promise<string> {
	if (file.type === 'application/pdf') {
		const data = await file.arrayBuffer();
		const textLayerResult = await deps.extractTextFromPdfTextLayer(data);
		if (textLayerResult.trim().length >= MIN_MEANINGFUL_TEXT_LENGTH) {
			return textLayerResult;
		}
		const images = await deps.renderPdfPagesToImages(data);
		const pageTexts = await Promise.all(images.map((image) => deps.extractTextFromImage(image)));
		return pageTexts.join('\n');
	}
	return deps.extractTextFromImage(file);
}
