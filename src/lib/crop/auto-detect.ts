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

// Box-downsamples grayscale so dense text smooths into the paper's average
// (avoiding fragmentation below) while the receipt/background edge survives.
function downsample(
	gray: Float32Array,
	width: number,
	height: number,
	outWidth: number,
	outHeight: number
): Float32Array {
	const sum = new Float32Array(outWidth * outHeight);
	const count = new Int32Array(outWidth * outHeight);
	for (let y = 0; y < height; y++) {
		const oy = Math.min(outHeight - 1, Math.floor((y * outHeight) / height));
		for (let x = 0; x < width; x++) {
			const ox = Math.min(outWidth - 1, Math.floor((x * outWidth) / width));
			const oi = oy * outWidth + ox;
			sum[oi] += gray[y * width + x];
			count[oi]++;
		}
	}
	for (let i = 0; i < sum.length; i++) sum[i] /= count[i] || 1;
	return sum;
}

// Shrinks bright by 1px to sever thin bridges into an adjacent bright background patch.
function erode(bright: Uint8Array, width: number, height: number): Uint8Array {
	const out = new Uint8Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (!bright[i]) continue;
			const left = x === 0 || bright[i - 1];
			const right = x === width - 1 || bright[i + 1];
			const up = y === 0 || bright[i - width];
			const down = y === height - 1 || bright[i + width];
			out[i] = left && right && up && down ? 1 : 0;
		}
	}
	return out;
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

const ANALYSIS_MAX = 100;
const MIN_AREA_FRACTION = 0.15;
const ERODE_ITERATIONS = 2;
const MIN_FILL_RATIO = 0.6; // below this, the box is mostly leaked-into empty space
const MAX_CHROMA = 40; // paper is near-neutral; excludes warm/colored bright backgrounds (wood, skin, fabric)

/** Guesses the receipt's bounding rectangle, or null if nothing plausible is found. */
export function detectReceiptQuad(data: Uint8ClampedArray, width: number, height: number): Quad | null {
	const pixelCount = width * height;
	if (pixelCount === 0) return null;

	const fullGray = new Float32Array(pixelCount);
	const fullChroma = new Float32Array(pixelCount);
	for (let i = 0; i < pixelCount; i++) {
		const o = i * 4;
		const r = data[o];
		const g = data[o + 1];
		const b = data[o + 2];
		fullGray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
		fullChroma[i] = Math.max(r, g, b) - Math.min(r, g, b);
	}

	const analysisScale = Math.min(1, ANALYSIS_MAX / Math.max(width, height));
	const aw = Math.max(1, Math.round(width * analysisScale));
	const ah = Math.max(1, Math.round(height * analysisScale));
	const gray = downsample(fullGray, width, height, aw, ah);
	const chroma = downsample(fullChroma, width, height, aw, ah);
	const analysisPixelCount = aw * ah;

	const threshold = otsuThreshold(gray);
	// Strictly greater: Otsu's boundary value belongs to the background cluster.
	const bright = new Uint8Array(analysisPixelCount);
	for (let i = 0; i < analysisPixelCount; i++)
		bright[i] = gray[i] > threshold && chroma[i] <= MAX_CHROMA ? 1 : 0;

	let eroded: Uint8Array = bright;
	for (let i = 0; i < ERODE_ITERATIONS; i++) eroded = erode(eroded, aw, ah);

	const region = largestBrightRegionBounds(eroded, aw, ah);
	if (!region) return null;

	const ex0 = Math.max(0, region.x0 - ERODE_ITERATIONS);
	const ey0 = Math.max(0, region.y0 - ERODE_ITERATIONS);
	const ex1 = Math.min(aw - 1, region.x1 + ERODE_ITERATIONS);
	const ey1 = Math.min(ah - 1, region.y1 + ERODE_ITERATIONS);

	const boxArea = (ex1 - ex0 + 1) * (ey1 - ey0 + 1);
	if (boxArea / analysisPixelCount < MIN_AREA_FRACTION) return null;

	let brightInBox = 0;
	for (let y = ey0; y <= ey1; y++) {
		for (let x = ex0; x <= ex1; x++) brightInBox += bright[y * aw + x];
	}
	if (brightInBox / boxArea < MIN_FILL_RATIO) return null;

	const x0 = Math.max(0, Math.floor((ex0 * width) / aw));
	const y0 = Math.max(0, Math.floor((ey0 * height) / ah));
	const x1 = Math.min(width - 1, Math.ceil(((ex1 + 1) * width) / aw) - 1);
	const y1 = Math.min(height - 1, Math.ceil(((ey1 + 1) * height) / ah) - 1);

	return [
		[x0, y0],
		[x1, y0],
		[x1, y1],
		[x0, y1]
	];
}
