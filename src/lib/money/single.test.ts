import { describe, expect, it } from 'vitest';
import { calculateSingleShare, calculateSingleSplit } from './single';

describe('calculateSingleShare', () => {
	it('returns 0 for null fraction (non mio)', () => {
		expect(calculateSingleShare(150, null)).toBe(0);
	});
	it('computes 1/3 of 100 rounded to nearest cent', () => {
		expect(calculateSingleShare(100, { num: 1, den: 3 })).toBe(33);
	});
	it('computes 2/3 of 100 rounded to nearest cent', () => {
		expect(calculateSingleShare(100, { num: 2, den: 3 })).toBe(67);
	});
	it('computes a custom percentage (40%) as num/den', () => {
		expect(calculateSingleShare(250, { num: 40, den: 100 })).toBe(100);
	});
	it('fully mine (implicit 1/1 via plain selection) is the whole amount', () => {
		expect(calculateSingleShare(199, { num: 1, den: 1 })).toBe(199);
	});
	it('handles a negative amount (whole-receipt discount) proportionally', () => {
		expect(calculateSingleShare(-100, { num: 1, den: 3 })).toBe(-33);
	});
});

describe('calculateSingleSplit', () => {
	it('sums shares across units, skipping unselected ones', () => {
		const total = calculateSingleSplit([
			{ amountCents: 150, fraction: { num: 1, den: 1 } }, // fully mine
			{ amountCents: 100, fraction: { num: 1, den: 3 } }, // shared 3 ways
			{ amountCents: 500, fraction: null } // not mine
		]);
		expect(total).toBe(150 + 33);
	});

	it('returns 0 for an empty unit list', () => {
		expect(calculateSingleSplit([])).toBe(0);
	});
});
