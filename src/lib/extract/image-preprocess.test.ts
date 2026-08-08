import { describe, expect, it } from 'vitest';
import { preprocessForOcr } from './image-preprocess';

function pixels(...rgba: number[][]): Uint8ClampedArray {
	return new Uint8ClampedArray(rgba.flat());
}

describe('preprocessForOcr', () => {
	it('converts a color pixel to grayscale using luminosity weighting (identical pixels, so contrast stretching is a no-op)', () => {
		const data = pixels([255, 0, 0, 255], [255, 0, 0, 255]);
		preprocessForOcr(data, 2, 1);
		const expectedGray = Math.round(0.299 * 255);
		expect(data[0]).toBe(expectedGray);
		expect(data[1]).toBe(expectedGray);
		expect(data[2]).toBe(expectedGray);
		expect(data[3]).toBe(255); // alpha untouched
	});

	it('stretches low-contrast grayscale so the darkest pixel becomes 0 and the lightest becomes 255', () => {
		// a faded photo: real range is only 100-180, not the full 0-255
		const data = pixels([100, 100, 100, 255], [140, 140, 140, 255], [180, 180, 180, 255]);
		preprocessForOcr(data, 3, 1);
		expect(data[0]).toBe(0);
		expect(data[4]).toBe(128); // midpoint stretches to ~128
		expect(data[8]).toBe(255);
	});

	it('leaves a flat (near-zero-variance) image as plain grayscale instead of amplifying noise', () => {
		const data = pixels([128, 128, 128, 255], [130, 130, 130, 255]);
		preprocessForOcr(data, 2, 1);
		expect(data[0]).toBe(128);
		expect(data[4]).toBe(130);
	});

	it('handles an all-black image without dividing by zero', () => {
		const data = pixels([0, 0, 0, 255], [0, 0, 0, 255]);
		preprocessForOcr(data, 2, 1);
		expect(data[0]).toBe(0);
		expect(data[4]).toBe(0);
		expect(Number.isNaN(data[0])).toBe(false);
	});

	it('processes every pixel in a larger buffer, not just the first', () => {
		const data = pixels(
			[50, 50, 50, 255],
			[100, 100, 100, 255],
			[150, 100, 50, 255],
			[250, 250, 250, 255]
		);
		preprocessForOcr(data, 4, 1);
		// darkest pixel (index 0) -> 0, lightest (index 3) -> 255
		expect(data[0]).toBe(0);
		expect(data[12]).toBe(255);
	});

	it('stretches each region against its own local contrast instead of the whole image (uneven lighting, e.g. glare on one side of a photo)', () => {
		// Left half: a faded, low-contrast patch (range 100-140), far from
		// pure white/black. Right half: a separate tile with its own
		// different, low-contrast range (10-50) — deliberately nowhere near
		// the left half's brightness, so a *global* min/max (10-140) would
		// stretch the left patch only a little instead of fully to 0-255.
		const width = 256; // 2 tiles wide at TILE_SIZE=128
		const height = 128;
		const data = new Uint8ClampedArray(width * height * 4);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4;
				const inLeftHalf = x < width / 2;
				// alternate two values within each half so each tile has a
				// real (non-zero) local range to stretch
				const value = inLeftHalf ? (x % 2 === 0 ? 100 : 140) : x % 2 === 0 ? 10 : 50;
				data[i] = data[i + 1] = data[i + 2] = value;
				data[i + 3] = 255;
			}
		}

		preprocessForOcr(data, width, height);

		// Sampled at each tile's own center (x=64, x=192) — halfway between
		// centers (around x=128) is a deliberate blend zone, not a place to
		// expect either tile's stretch in isolation.
		const leftDark = data[(64 * width + 64) * 4];
		const leftLight = data[(64 * width + 65) * 4];
		// ...independently of the right tile's unrelated 10-50 range
		const rightDark = data[(64 * width + 192) * 4];
		const rightLight = data[(64 * width + 193) * 4];

		expect(leftDark).toBeLessThan(30);
		expect(leftLight).toBeGreaterThan(225);
		expect(rightDark).toBeLessThan(30);
		expect(rightLight).toBeGreaterThan(225);
	});
});
