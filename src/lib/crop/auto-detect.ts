import type { Quad } from './warp';

// Otsu's method: adapts the paper/background split to each photo's own lighting.
function otsuThreshold(gray: Float32Array): number {
	const histogram = new Array(256).fill(0);
	for (const value of gray) histogram[Math.round(value)]++;

	const total = gray.length;
	let sumAll = 0;
	for (let i = 0; i < 256; i++) sumAll += i * histogram[i];

	let sumBackground = 0;
	let weightBackground = 0;
	let best = 0;
	let bestVariance = -1;

	for (let t = 0; t < 256; t++) {
		weightBackground += histogram[t];
		if (weightBackground === 0) continue;
		const weightForeground = total - weightBackground;
		if (weightForeground === 0) break;

		sumBackground += t * histogram[t];
		const meanBackground = sumBackground / weightBackground;
		const meanForeground = (sumAll - sumBackground) / weightForeground;
		const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

		if (variance > bestVariance) {
			bestVariance = variance;
			best = t;
		}
	}

	return best;
}

// Largest 4-connected bright region, via iterative (non-recursive) flood fill.
function largestBrightRegionBounds(
	bright: Uint8Array,
	width: number,
	height: number
): { x0: number; y0: number; x1: number; y1: number; size: number } | null {
	const visited = new Uint8Array(width * height);
	const stack = new Int32Array(width * height);
	let best: { x0: number; y0: number; x1: number; y1: number; size: number } | null = null;

	for (let start = 0; start < width * height; start++) {
		if (!bright[start] || visited[start]) continue;

		let stackLength = 0;
		stack[stackLength++] = start;
		visited[start] = 1;
		let x0 = width;
		let y0 = height;
		let x1 = -1;
		let y1 = -1;
		let size = 0;

		while (stackLength > 0) {
			const idx = stack[--stackLength];
			const x = idx % width;
			const y = (idx - x) / width;
			size++;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;

			if (x > 0 && bright[idx - 1] && !visited[idx - 1]) {
				visited[idx - 1] = 1;
				stack[stackLength++] = idx - 1;
			}
			if (x < width - 1 && bright[idx + 1] && !visited[idx + 1]) {
				visited[idx + 1] = 1;
				stack[stackLength++] = idx + 1;
			}
			if (y > 0 && bright[idx - width] && !visited[idx - width]) {
				visited[idx - width] = 1;
				stack[stackLength++] = idx - width;
			}
			if (y < height - 1 && bright[idx + width] && !visited[idx + width]) {
				visited[idx + width] = 1;
				stack[stackLength++] = idx + width;
			}
		}

		if (!best || size > best.size) best = { x0, y0, x1, y1, size };
	}

	return best;
}

const MIN_AREA_FRACTION = 0.15;
const MAX_AREA_FRACTION = 0.97;

/**
 * Guesses the receipt's bounding rectangle for pre-seeding the crop editor's
 * corner handles. Returns null (fall back to the default inset) when
 * nothing plausible is found. Axis-aligned only — dragging fixes rotation.
 */
export function detectReceiptQuad(data: Uint8ClampedArray, width: number, height: number): Quad | null {
	const pixelCount = width * height;
	if (pixelCount === 0) return null;

	const gray = new Float32Array(pixelCount);
	for (let i = 0; i < pixelCount; i++) {
		const o = i * 4;
		gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
	}

	const threshold = otsuThreshold(gray);
	// Strictly greater: Otsu's boundary value belongs to the background cluster.
	const bright = new Uint8Array(pixelCount);
	for (let i = 0; i < pixelCount; i++) bright[i] = gray[i] > threshold ? 1 : 0;

	const region = largestBrightRegionBounds(bright, width, height);
	if (!region) return null;

	const areaFraction = region.size / pixelCount;
	if (areaFraction < MIN_AREA_FRACTION || areaFraction > MAX_AREA_FRACTION) return null;

	const { x0, y0, x1, y1 } = region;
	return [
		[x0, y0],
		[x1, y0],
		[x1, y1],
		[x0, y1]
	];
}
