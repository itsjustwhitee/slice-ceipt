/**
 * Converts an RGBA pixel buffer to grayscale in place (luminosity-weighted:
 * 0.299R + 0.587G + 0.114B, the standard perceptual weighting), then
 * stretches contrast so the darkest pixel becomes 0 and the lightest
 * becomes 255. A receipt photo is very often low-contrast — faded thermal
 * paper, a shadow across part of it, dim indoor lighting — well before
 * it's unreadable to a human eye, and Tesseract's recognition is
 * measurably more sensitive to that than a human is. Alpha is left
 * untouched.
 *
 * Deliberately stops short of a hard black/white threshold
 * (binarization): that's a bigger lever but also a riskier one — it can
 * clip thin or anti-aliased character strokes that grayscale + contrast
 * alone preserve, and Tesseract's own recognition models are trained on
 * grayscale input, not pre-binarized images.
 *
 * Pure pixel-buffer math with no DOM/canvas dependency, so it's unit
 * -testable directly — see `ocr.ts` for the thin canvas wrapper that
 * actually applies this to a photo before handing it to Tesseract.
 */
export function preprocessForOcr(data: Uint8ClampedArray): void {
	const pixelCount = data.length / 4;
	const gray = new Float32Array(pixelCount);

	let min = 255;
	let max = 0;
	for (let i = 0; i < pixelCount; i++) {
		const o = i * 4;
		const value = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
		gray[i] = value;
		if (value < min) min = value;
		if (value > max) max = value;
	}

	const range = max - min;
	// A range this small means the photo is already flat (uniform color,
	// or blank) — stretching it further would mostly amplify noise, not
	// signal, so grayscale alone is left as the result.
	const stretch = range > 10;
	const scale = stretch ? 255 / range : 1;

	for (let i = 0; i < pixelCount; i++) {
		const value = stretch ? (gray[i] - min) * scale : gray[i];
		const o = i * 4;
		data[o] = value;
		data[o + 1] = value;
		data[o + 2] = value;
	}
}
