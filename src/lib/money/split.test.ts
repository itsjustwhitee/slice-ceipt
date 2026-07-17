import { describe, expect, it } from 'vitest';
import { splitAmongWeights } from './split';

describe('splitAmongWeights', () => {
	it('splits evenly when it divides exactly (150 / 3)', () => {
		const result = splitAmongWeights(150, [
			{ participantId: 'A', weight: 1 },
			{ participantId: 'B', weight: 1 },
			{ participantId: 'C', weight: 1 }
		]);
		expect(result.get('A')).toBe(50);
		expect(result.get('B')).toBe(50);
		expect(result.get('C')).toBe(50);
	});

	it('matches idea.md example exactly: 100 cents / 3 equal people -> 34/33/33, first in order wins the tie', () => {
		const result = splitAmongWeights(100, [
			{ participantId: 'Matteo', weight: 1 },
			{ participantId: 'Andrea', weight: 1 },
			{ participantId: 'Chiara', weight: 1 }
		]);
		expect(result.get('Matteo')).toBe(34);
		expect(result.get('Andrea')).toBe(33);
		expect(result.get('Chiara')).toBe(33);
		const sum = [...result.values()].reduce((a, b) => a + b, 0);
		expect(sum).toBe(100);
	});

	it('order matters for ties: reordering the same people changes who gets the extra cent', () => {
		const result = splitAmongWeights(100, [
			{ participantId: 'Chiara', weight: 1 },
			{ participantId: 'Andrea', weight: 1 },
			{ participantId: 'Matteo', weight: 1 }
		]);
		expect(result.get('Chiara')).toBe(34);
		expect(result.get('Andrea')).toBe(33);
		expect(result.get('Matteo')).toBe(33);
	});

	it('custom weights: proportional split with no remainder (70/30 of 100)', () => {
		const result = splitAmongWeights(100, [
			{ participantId: 'A', weight: 70 },
			{ participantId: 'B', weight: 30 }
		]);
		expect(result.get('A')).toBe(70);
		expect(result.get('B')).toBe(30);
	});

	it('custom weights: proportional split with remainder goes to larger remainder (1:2 of 100)', () => {
		const result = splitAmongWeights(100, [
			{ participantId: 'A', weight: 1 },
			{ participantId: 'B', weight: 2 }
		]);
		// exact: A=33.33 B=66.67 -> floors 33/66, leftover 1 -> B has bigger remainder
		expect(result.get('A')).toBe(33);
		expect(result.get('B')).toBe(67);
		expect((result.get('A') ?? 0) + (result.get('B') ?? 0)).toBe(100);
	});

	it('more participants than cents: some get zero', () => {
		const result = splitAmongWeights(2, [
			{ participantId: 'A', weight: 1 },
			{ participantId: 'B', weight: 1 },
			{ participantId: 'C', weight: 1 },
			{ participantId: 'D', weight: 1 },
			{ participantId: 'E', weight: 1 }
		]);
		const values = [...result.values()];
		expect(values.reduce((a, b) => a + b, 0)).toBe(2);
		expect(values.filter((v) => v === 1).length).toBe(2);
		expect(values.filter((v) => v === 0).length).toBe(3);
		// first two in order get the cents
		expect(result.get('A')).toBe(1);
		expect(result.get('B')).toBe(1);
		expect(result.get('C')).toBe(0);
	});

	it('single participant gets the whole amount', () => {
		const result = splitAmongWeights(133, [{ participantId: 'A', weight: 1 }]);
		expect(result.get('A')).toBe(133);
	});

	it('negative amount (whole-receipt discount) splits correctly and reconciles exactly', () => {
		const result = splitAmongWeights(-100, [
			{ participantId: 'Matteo', weight: 1 },
			{ participantId: 'Andrea', weight: 1 },
			{ participantId: 'Chiara', weight: 1 }
		]);
		const sum = [...result.values()].reduce((a, b) => a + b, 0);
		expect(sum).toBe(-100);
		// -100/3 = -33.33; floor -> -34 each; leftover = -100 - (-102) = 2
		// first two in order get bumped up (less negative) by 1
		expect(result.get('Matteo')).toBe(-33);
		expect(result.get('Andrea')).toBe(-33);
		expect(result.get('Chiara')).toBe(-34);
	});

	it('zero amount splits to all zeros', () => {
		const result = splitAmongWeights(0, [
			{ participantId: 'A', weight: 1 },
			{ participantId: 'B', weight: 1 }
		]);
		expect(result.get('A')).toBe(0);
		expect(result.get('B')).toBe(0);
	});

	it('throws on empty participants', () => {
		expect(() => splitAmongWeights(100, [])).toThrow();
	});

	it('throws on a non-integer weight', () => {
		expect(() =>
			splitAmongWeights(100, [
				{ participantId: 'A', weight: 1.5 },
				{ participantId: 'B', weight: 1 }
			])
		).toThrow();
	});

	it('throws on non-positive weight', () => {
		expect(() =>
			splitAmongWeights(100, [
				{ participantId: 'A', weight: 0 },
				{ participantId: 'B', weight: 1 }
			])
		).toThrow();
	});

	it('reconciles exactly across many random-ish amounts and participant counts', () => {
		for (let amount = -500; amount <= 500; amount += 37) {
			for (let n = 1; n <= 7; n++) {
				const participants = Array.from({ length: n }, (_, i) => ({
					participantId: `P${i}`,
					weight: 1 + (i % 3)
				}));
				const result = splitAmongWeights(amount, participants);
				const sum = [...result.values()].reduce((a, b) => a + b, 0);
				expect(sum).toBe(amount);
			}
		}
	});
});
