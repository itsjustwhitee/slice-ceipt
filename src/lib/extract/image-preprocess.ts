/**
 * Grayscales an RGBA buffer in place (luminosity-weighted), then stretches
 * contrast so the darkest pixel becomes 0 and lightest becomes 255. Stops
 * short of hard black/white thresholding, which can clip thin strokes.
 * Pure math, no DOM — see ocr.ts for the canvas wrapper.
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
	// Below this, the photo is already flat — stretching would amplify noise, not signal.
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
