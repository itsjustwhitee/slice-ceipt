import { describe, expect, it } from 'vitest';
import { calculateGroupSplit } from './aggregate';

describe('calculateGroupSplit', () => {
	const order = ['Matteo', 'Andrea', 'Chiara'];

	it('every participant appears in totals even with zero', () => {
		const result = calculateGroupSplit(
			[{ amountCents: 100, assignment: new Map([['Matteo', 1]]) }],
			order
		);
		expect(result.totals.get('Matteo')).toBe(100);
		expect(result.totals.get('Andrea')).toBe(0);
		expect(result.totals.get('Chiara')).toBe(0);
	});

	it('flags unassigned units and excludes them from totals', () => {
		const result = calculateGroupSplit(
			[
				{ amountCents: 150, assignment: new Map() },
				{ amountCents: 100, assignment: new Map([['Matteo', 1]]) }
			],
			order
		);
		expect(result.unassignedUnitIndices).toEqual([0]);
		expect(result.unassignedTotalCents).toBe(150);
		expect(result.totals.get('Matteo')).toBe(100);
	});

	it('tie-break uses the canonical participant order, not assignment Map insertion order', () => {
		// Assignment map is built with Andrea inserted before Matteo, but the
		// canonical participantOrder puts Matteo first -> Matteo should win ties.
		const assignment = new Map([
			['Andrea', 1],
			['Matteo', 1],
			['Chiara', 1]
		]);
		const result = calculateGroupSplit([{ amountCents: 100, assignment }], order);
		expect(result.totals.get('Matteo')).toBe(34);
		expect(result.totals.get('Andrea')).toBe(33);
		expect(result.totals.get('Chiara')).toBe(33);
	});

	it('accumulates across multiple units for the same participant', () => {
		const result = calculateGroupSplit(
			[
				{ amountCents: 100, assignment: new Map([['Matteo', 1]]) },
				{ amountCents: 50, assignment: new Map([['Matteo', 1]]) }
			],
			order
		);
		expect(result.totals.get('Matteo')).toBe(150);
	});

	it('whole-receipt discount (negative amount) reduces totals correctly when split among all', () => {
		const result = calculateGroupSplit(
			[
				{
					amountCents: 300,
					assignment: new Map([
						['Matteo', 1],
						['Andrea', 1],
						['Chiara', 1]
					])
				},
				{
					amountCents: -100,
					assignment: new Map([
						['Matteo', 1],
						['Andrea', 1],
						['Chiara', 1]
					])
				}
			],
			order
		);
		// 300 split 3 ways = 100 each; -100 split 3 ways = -33/-33/-34
		// (first two in canonical order win the remainder tie, per splitAmongWeights)
		expect(result.totals.get('Matteo')).toBe(100 - 33);
		expect(result.totals.get('Andrea')).toBe(100 - 33);
		expect(result.totals.get('Chiara')).toBe(100 - 34);
		const sum = [...result.totals.values()].reduce((a, b) => a + b, 0);
		expect(sum).toBe(300 - 100);
	});

	it('empty units list returns all-zero totals with no unassigned', () => {
		const result = calculateGroupSplit([], order);
		expect(result.totals.get('Matteo')).toBe(0);
		expect(result.unassignedUnitIndices).toEqual([]);
		expect(result.unassignedTotalCents).toBe(0);
	});
});
