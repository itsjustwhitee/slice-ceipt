import { describe, expect, it } from 'vitest';
import { detectReceiptQuad } from './auto-detect';

function makeImage(width: number, height: number, fill: (x: number, y: number) => number): Uint8ClampedArray {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const value = fill(x, y);
			data[i] = data[i + 1] = data[i + 2] = value;
			data[i + 3] = 255;
		}
	}
	return data;
}

describe('detectReceiptQuad', () => {
	it('finds a bright rectangle (the receipt) on a dark background', () => {
		const width = 100;
		const height = 100;
		const rect = { x0: 20, y0: 10, x1: 79, y1: 89 };
		const data = makeImage(width, height, (x, y) =>
			x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1 ? 230 : 30
		);

		const quad = detectReceiptQuad(data, width, height);

		expect(quad).not.toBeNull();
		const [tl, tr, br, bl] = quad!;
		expect(tl).toEqual([rect.x0, rect.y0]);
		expect(tr).toEqual([rect.x1, rect.y0]);
		expect(br).toEqual([rect.x1, rect.y1]);
		expect(bl).toEqual([rect.x0, rect.y1]);
	});

	it('returns null for a near-uniform photo with no distinguishable receipt', () => {
		const width = 50;
		const height = 50;
		// tiny per-pixel jitter, not a real region
		const data = makeImage(width, height, (x, y) => 128 + ((x + y) % 2));
		expect(detectReceiptQuad(data, width, height)).toBeNull();
	});

	it('returns null when the bright region is implausibly tiny (a glare speck, not a receipt)', () => {
		const width = 100;
		const height = 100;
		const data = makeImage(width, height, (x, y) => (x < 5 && y < 5 ? 250 : 20));
		expect(detectReceiptQuad(data, width, height)).toBeNull();
	});

	it('returns null when the whole frame is already bright (no contrast to find an edge from)', () => {
		const width = 40;
		const height = 40;
		const data = makeImage(width, height, () => 240);
		expect(detectReceiptQuad(data, width, height)).toBeNull();
	});

	it('picks the larger of two separate bright regions', () => {
		const width = 120;
		const height = 60;
		// small bright square (decoy) plus a larger bright rectangle (the receipt)
		const data = makeImage(width, height, (x, y) => {
			const inDecoy = x >= 5 && x <= 15 && y >= 5 && y <= 15;
			const inReceipt = x >= 40 && x <= 100 && y >= 10 && y <= 50;
			return inDecoy || inReceipt ? 220 : 25;
		});

		const quad = detectReceiptQuad(data, width, height);
		expect(quad).not.toBeNull();
		const [tl, , br] = quad!;
		expect(tl).toEqual([40, 10]);
		expect(br).toEqual([100, 50]);
	});
});
