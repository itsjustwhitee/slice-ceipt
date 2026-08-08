// Local (tile-based) rather than whole-image contrast stretch: a receipt
// photo's lighting is often uneven across the frame (a shadow on one side,
// glare on another), so a single global min/max lets the brightest/darkest
// spot anywhere in the photo set the stretch for the entire image — a
// glare highlight elsewhere leaves genuinely readable text under-stretched.
// Splitting into tiles and stretching each against its own local min/max
// (bilinearly blended between tile centers, to avoid hard block edges)
// keeps every region's own contrast independent of what's happening
// elsewhere in the photo.
// Tuned against real photos, not guessed: 32 seemed like a reasonable
// "local" size on paper, but tested worse than a plain global stretch on
// receipts photographed against a textured background (wood-grain table,
// checkered fabric) — small tiles happily maximize contrast on the
// texture's own local variation, not just the text. 128 stayed clearly
// better than both the old global version AND 32 across every real photo
// tested (including two severely degraded ones where it recovered several
// previously-unreadable line items outright).
const TILE_SIZE = 128;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Grayscales an RGBA buffer in place (luminosity-weighted), then applies a
 * local adaptive contrast stretch (see TILE_SIZE comment above). Stops
 * short of hard black/white thresholding, which can clip thin strokes.
 * Pure math, no DOM — see ocr.ts for the canvas wrapper.
 */
export function preprocessForOcr(data: Uint8ClampedArray, width: number, height: number): void {
	const pixelCount = width * height;
	const gray = new Float32Array(pixelCount);
	for (let i = 0; i < pixelCount; i++) {
		const o = i * 4;
		gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
	}

	const tilesX = Math.max(1, Math.ceil(width / TILE_SIZE));
	const tilesY = Math.max(1, Math.ceil(height / TILE_SIZE));
	const tileMin = new Float32Array(tilesX * tilesY).fill(255);
	const tileMax = new Float32Array(tilesX * tilesY).fill(0);

	for (let ty = 0; ty < tilesY; ty++) {
		for (let tx = 0; tx < tilesX; tx++) {
			const x0 = tx * TILE_SIZE;
			const x1 = Math.min(width, x0 + TILE_SIZE);
			const y0 = ty * TILE_SIZE;
			const y1 = Math.min(height, y0 + TILE_SIZE);
			let min = 255;
			let max = 0;
			for (let y = y0; y < y1; y++) {
				for (let x = x0; x < x1; x++) {
					const value = gray[y * width + x];
					if (value < min) min = value;
					if (value > max) max = value;
				}
			}
			tileMin[ty * tilesX + tx] = min;
			tileMax[ty * tilesX + tx] = max;
		}
	}

	for (let y = 0; y < height; y++) {
		// Tile-space position of this pixel, offset so tile centers (not
		// corners) are the interpolation anchors, and clamped BEFORE
		// splitting into floor/fraction — otherwise an edge pixel (outside
		// every tile center) computes its fraction against the unclamped
		// value while its index already got clamped, blending in a tile
		// that isn't actually adjacent.
		const ty = clamp(y / TILE_SIZE - 0.5, 0, tilesY - 1);
		const ty0 = Math.floor(ty);
		const ty1 = clamp(ty0 + 1, 0, tilesY - 1);
		const fy = ty - ty0;

		for (let x = 0; x < width; x++) {
			const tx = clamp(x / TILE_SIZE - 0.5, 0, tilesX - 1);
			const tx0 = Math.floor(tx);
			const tx1 = clamp(tx0 + 1, 0, tilesX - 1);
			const fx = tx - tx0;

			const min00 = tileMin[ty0 * tilesX + tx0];
			const min10 = tileMin[ty0 * tilesX + tx1];
			const min01 = tileMin[ty1 * tilesX + tx0];
			const min11 = tileMin[ty1 * tilesX + tx1];
			const max00 = tileMax[ty0 * tilesX + tx0];
			const max10 = tileMax[ty0 * tilesX + tx1];
			const max01 = tileMax[ty1 * tilesX + tx0];
			const max11 = tileMax[ty1 * tilesX + tx1];

			const min = lerp(lerp(min00, min10, fx), lerp(min01, min11, fx), fy);
			const max = lerp(lerp(max00, max10, fx), lerp(max01, max11, fx), fy);

			const idx = y * width + x;
			const range = max - min;
			// Same flat-patch guard as the old global version: below this,
			// stretching would amplify noise, not signal.
			const value = range > 10 ? clamp(((gray[idx] - min) * 255) / range, 0, 255) : gray[idx];

			const o = idx * 4;
			data[o] = value;
			data[o + 1] = value;
			data[o + 2] = value;
		}
	}
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}
