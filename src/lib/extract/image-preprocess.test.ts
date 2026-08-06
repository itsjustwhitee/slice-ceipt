import { describe, expect, it } from 'vitest';
import { preprocessForOcr } from './image-preprocess';

function pixels(...rgba: number[][]): Uint8ClampedArray {
	return new Uint8ClampedArray(rgba.flat());
}

describe('preprocessForOcr', () => {
	it('converts a color pixel to grayscale using luminosity weighting (identical pixels, so contrast stretching is a no-op)', () => {
		const data = pixels([255, 0, 0, 255], [255, 0, 0, 255]);
		preprocessForOcr(data);
		const expectedGray = Math.round(0.299 * 255);
		expect(data[0]).toBe(expectedGray);
		expect(data[1]).toBe(expectedGray);
		expect(data[2]).toBe(expectedGray);
		expect(data[3]).toBe(255); // alpha untouched
	});

	it('stretches low-contrast grayscale so the darkest pixel becomes 0 and the lightest becomes 255', () => {
		// a faded photo: real range is only 100-180, not the full 0-255
		const data = pixels([100, 100, 100, 255], [140, 140, 140, 255], [180, 180, 180, 255]);
		preprocessForOcr(data);
		expect(data[0]).toBe(0);
		expect(data[4]).toBe(128); // midpoint stretches to ~128
		expect(data[8]).toBe(255);
	});

	it('leaves a flat (near-zero-variance) image as plain grayscale instead of amplifying noise', () => {
		const data = pixels([128, 128, 128, 255], [130, 130, 130, 255]);
		preprocessForOcr(data);
		expect(data[0]).toBe(128);
		expect(data[4]).toBe(130);
	});

	it('handles an all-black image without dividing by zero', () => {
		const data = pixels([0, 0, 0, 255], [0, 0, 0, 255]);
		preprocessForOcr(data);
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
		preprocessForOcr(data);
		// darkest pixel (index 0) -> 0, lightest (index 3) -> 255
		expect(data[0]).toBe(0);
		expect(data[12]).toBe(255);
	});
});
