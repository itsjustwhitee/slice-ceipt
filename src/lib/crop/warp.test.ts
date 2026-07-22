import { describe, expect, it } from 'vitest';
import { affineFromTriangles, quadOutputSize, type Point, type Quad } from './warp';

function applyAffine(m: number[], [x, y]: Point): Point {
	return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

describe('affineFromTriangles', () => {
	it('maps each source corner exactly onto its destination corner (scale + translate case)', () => {
		const src: [Point, Point, Point] = [[0, 0], [2, 0], [0, 2]];
		const dst: [Point, Point, Point] = [[5, 5], [9, 5], [5, 13]];
		const m = affineFromTriangles(src, dst);
		expect(m).not.toBeNull();
		src.forEach((p, i) => {
			const [x, y] = applyAffine(m as number[], p);
			expect(x).toBeCloseTo(dst[i][0]);
			expect(y).toBeCloseTo(dst[i][1]);
		});
	});

	it('maps each source corner exactly onto its destination corner (skewed case)', () => {
		const src: [Point, Point, Point] = [[0, 0], [1, 0], [0, 1]];
		const dst: [Point, Point, Point] = [[0, 0], [2, 0], [1, 3]];
		const m = affineFromTriangles(src, dst);
		expect(m).not.toBeNull();
		src.forEach((p, i) => {
			const [x, y] = applyAffine(m as number[], p);
			expect(x).toBeCloseTo(dst[i][0]);
			expect(y).toBeCloseTo(dst[i][1]);
		});
	});

	it('returns null for a degenerate (collinear) source triangle', () => {
		const src: [Point, Point, Point] = [[0, 0], [1, 1], [2, 2]];
		const dst: [Point, Point, Point] = [[0, 0], [1, 0], [2, 0]];
		expect(affineFromTriangles(src, dst)).toBeNull();
	});
});

describe('quadOutputSize', () => {
	it('returns the exact side lengths for an axis-aligned rectangle', () => {
		const quad: Quad = [[0, 0], [100, 0], [100, 50], [0, 50]];
		expect(quadOutputSize(quad)).toEqual({ width: 100, height: 50 });
	});

	it('averages the two opposite edge lengths for a non-rectangular quad', () => {
		const quad: Quad = [[0, 0], [100, 0], [80, 50], [20, 50]];
		// top width 100, bottom width 60 -> avg 80
		// left/right height both hypot(20,50) ~= 53.8516 -> rounds to 54
		expect(quadOutputSize(quad)).toEqual({ width: 80, height: 54 });
	});
});
