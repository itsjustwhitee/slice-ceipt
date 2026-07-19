import { describe, expect, it } from 'vitest';
import {
	createGroupItemsFromParsed,
	computeGroupTotals,
	computeGroupItemization,
	aggregateItemAssignment,
	type GroupItem
} from './group';

describe('createGroupItemsFromParsed', () => {
	it('decomposes quantity into that many unassigned units for a plain item', () => {
		const items = createGroupItemsFromParsed(
			[{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }],
			['matteo', 'andrea']
		);
		expect(items).toHaveLength(1);
		expect(items[0].id).toBe('item-0');
		expect(items[0].units).toHaveLength(3);
		for (const unit of items[0].units) {
			expect(unit.assignment.size).toBe(0);
		}
	});

	it('defaults a whole-receipt-discount item to fully assigned across all participants', () => {
		const items = createGroupItemsFromParsed(
			[
				{
					name: 'SCONTO FEDELTA',
					unitPriceCents: -200,
					quantity: 1,
					isWholeReceiptDiscount: true
				}
			],
			['matteo', 'andrea', 'chiara']
		);
		expect(items[0].units).toHaveLength(1);
		expect(items[0].units[0].assignment).toEqual(
			new Map([
				['matteo', 1],
				['andrea', 1],
				['chiara', 1]
			])
		);
	});

	it('carries over originalPriceCents for a per-item-discounted item', () => {
		const items = createGroupItemsFromParsed(
			[{ name: 'PASTA', unitPriceCents: 100, quantity: 1, originalPriceCents: 120 }],
			['matteo']
		);
		expect(items[0].originalPriceCents).toBe(120);
	});

	it('assigns sequential ids across multiple items', () => {
		const items = createGroupItemsFromParsed(
			[
				{ name: 'PANE', unitPriceCents: 250, quantity: 1 },
				{ name: 'LATTE', unitPriceCents: 180, quantity: 1 }
			],
			[]
		);
		expect(items.map((i) => i.id)).toEqual(['item-0', 'item-1']);
	});
});

describe('computeGroupTotals', () => {
	it('matches idea.md example: 3 beers at 1,50 split among Matteo/Andrea/Chiara -> 150 each, summed', () => {
		const items = createGroupItemsFromParsed(
			[{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }],
			['matteo', 'andrea', 'chiara']
		);
		// assign all 3 units equally to all 3 participants
		for (const unit of items[0].units) {
			unit.assignment.set('matteo', 1);
			unit.assignment.set('andrea', 1);
			unit.assignment.set('chiara', 1);
		}
		const result = computeGroupTotals(items, ['matteo', 'andrea', 'chiara']);
		// each unit of 150 splits 50/50/50 (divides evenly, no remainder)
		expect(result.totals.get('matteo')).toBe(150);
		expect(result.totals.get('andrea')).toBe(150);
		expect(result.totals.get('chiara')).toBe(150);
	});

	it('flags unassigned units and excludes them from totals', () => {
		const items = createGroupItemsFromParsed(
			[{ name: 'PANE', unitPriceCents: 250, quantity: 1 }],
			['matteo']
		);
		const result = computeGroupTotals(items, ['matteo']);
		expect(result.unassignedUnitIndices).toEqual([0]);
		expect(result.unassignedTotalCents).toBe(250);
		expect(result.totals.get('matteo')).toBe(0);
	});

	it('whole-receipt discount defaults reduce every participant automatically', () => {
		const items = createGroupItemsFromParsed(
			[
				{
					name: 'SCONTO FEDELTA',
					unitPriceCents: -90,
					quantity: 1,
					isWholeReceiptDiscount: true
				}
			],
			['matteo', 'andrea', 'chiara']
		);
		const result = computeGroupTotals(items, ['matteo', 'andrea', 'chiara']);
		expect(result.totals.get('matteo')).toBe(-30);
		expect(result.totals.get('andrea')).toBe(-30);
		expect(result.totals.get('chiara')).toBe(-30);
		expect(result.unassignedUnitIndices).toEqual([]);
	});

	it('lists only items the participant is assigned to, with their per-item share', () => {
		const items: GroupItem[] = [
			{
				id: 'item-0',
				name: 'Bread',
				unitPriceCents: 250,
				quantity: 1,
				units: [{ assignment: new Map([['alice', 1]]) }]
			},
			{
				id: 'item-1',
				name: 'Milk',
				unitPriceCents: 100,
				quantity: 2,
				units: [
					{ assignment: new Map([['alice', 1], ['bob', 1]]) },
					{ assignment: new Map([['bob', 1]]) }
				]
			},
			{
				id: 'item-2',
				name: 'Eggs',
				unitPriceCents: 300,
				quantity: 1,
				units: [{ assignment: new Map() }]
			}
		];
		const aliceItems = computeGroupItemization(items, 'alice', ['alice', 'bob']);
		expect(aliceItems).toEqual([
			{ name: 'Bread', shareCents: 250 },
			{ name: 'Milk', shareCents: 50 }
		]);
		expect(aliceItems.find((i) => i.name === 'Eggs')).toBeUndefined();
	});

	it('itemization sums to exactly the same total as computeGroupTotals, for every participant', () => {
		const items: GroupItem[] = [
			{
				id: 'item-0',
				name: 'Bread',
				unitPriceCents: 250,
				quantity: 1,
				units: [{ assignment: new Map([['alice', 1]]) }]
			},
			{
				id: 'item-1',
				name: 'Milk',
				unitPriceCents: 100,
				quantity: 2,
				units: [
					{ assignment: new Map([['alice', 1], ['bob', 1]]) },
					{ assignment: new Map([['bob', 1]]) }
				]
			}
		];
		const participantOrder = ['alice', 'bob'];
		const totals = computeGroupTotals(items, participantOrder);
		for (const id of participantOrder) {
			const itemization = computeGroupItemization(items, id, participantOrder);
			const sum = itemization.reduce((acc, i) => acc + i.shareCents, 0);
			expect(sum).toBe(totals.totals.get(id));
		}
	});
});

describe('aggregateItemAssignment', () => {
	it('sums each participant\'s weight across every unit of an item', () => {
		const units = [
			{ assignment: new Map([['alice', 1]]) },
			{ assignment: new Map([['alice', 1], ['bob', 2]]) }
		];
		const result = aggregateItemAssignment(units);
		expect(result.get('alice')).toBe(2);
		expect(result.get('bob')).toBe(2);
	});

	it('returns an empty map when no unit has any assignment', () => {
		const units = [{ assignment: new Map() }, { assignment: new Map() }];
		expect(aggregateItemAssignment(units).size).toBe(0);
	});
});
