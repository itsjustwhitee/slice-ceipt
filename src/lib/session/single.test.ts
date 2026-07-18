import { describe, expect, it } from 'vitest';
import {
	createSingleItemsFromParsed,
	computeSingleTotal,
	computeSingleItemization,
	type SingleItem
} from './single';

describe('createSingleItemsFromParsed', () => {
	it('decomposes quantity into that many "non mio" (null fraction) units for a plain item', () => {
		const items = createSingleItemsFromParsed(
			[{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }],
			4
		);
		expect(items[0].units).toHaveLength(3);
		for (const unit of items[0].units) {
			expect(unit.fraction).toBeNull();
		}
	});

	it('defaults a whole-receipt-discount item to 1/participantCount', () => {
		const items = createSingleItemsFromParsed(
			[
				{
					name: 'SCONTO FEDELTA',
					unitPriceCents: -200,
					quantity: 1,
					isWholeReceiptDiscount: true
				}
			],
			4
		);
		expect(items[0].units[0].fraction).toEqual({ num: 1, den: 4 });
	});
});

describe('computeSingleTotal', () => {
	it('is 0 when every unit is unassigned (non mio)', () => {
		const items = createSingleItemsFromParsed(
			[{ name: 'PANE', unitPriceCents: 250, quantity: 1 }],
			3
		);
		expect(computeSingleTotal(items)).toBe(0);
	});

	it('sums the users own selected shares across items', () => {
		const items = createSingleItemsFromParsed(
			[
				{ name: 'PANE', unitPriceCents: 250, quantity: 1 }, // fully mine
				{ name: 'BIRRA', unitPriceCents: 150, quantity: 1 } // shared 1/3
			],
			3
		);
		items[0].units[0].fraction = { num: 1, den: 1 };
		items[1].units[0].fraction = { num: 1, den: 3 };
		expect(computeSingleTotal(items)).toBe(250 + 50);
	});

	it('whole-receipt discount default contributes automatically to the total', () => {
		const items = createSingleItemsFromParsed(
			[
				{
					name: 'SCONTO FEDELTA',
					unitPriceCents: -90,
					quantity: 1,
					isWholeReceiptDiscount: true
				}
			],
			3
		);
		expect(computeSingleTotal(items)).toBe(-30);
	});

	it('lists only items with at least one included unit, with the summed share', () => {
		const items: SingleItem[] = [
			{
				id: 'item-0',
				name: 'Bread',
				unitPriceCents: 250,
				quantity: 1,
				units: [{ fraction: { num: 1, den: 2 } }]
			},
			{
				id: 'item-1',
				name: 'Milk',
				unitPriceCents: 100,
				quantity: 2,
				units: [{ fraction: null }, { fraction: { num: 1, den: 1 } }]
			},
			{
				id: 'item-2',
				name: 'Eggs',
				unitPriceCents: 300,
				quantity: 1,
				units: [{ fraction: null }]
			}
		];
		const result = computeSingleItemization(items);
		expect(result).toEqual([
			{ name: 'Bread', shareCents: 125 },
			{ name: 'Milk', shareCents: 100 }
		]);
		expect(result.find((i) => i.name === 'Eggs')).toBeUndefined();
	});

	it('itemization sums to exactly the same total as computeSingleTotal', () => {
		const items: SingleItem[] = [
			{
				id: 'item-0',
				name: 'Bread',
				unitPriceCents: 250,
				quantity: 1,
				units: [{ fraction: { num: 1, den: 2 } }]
			},
			{
				id: 'item-1',
				name: 'Milk',
				unitPriceCents: 100,
				quantity: 2,
				units: [{ fraction: null }, { fraction: { num: 1, den: 1 } }]
			}
		];
		const result = computeSingleItemization(items);
		const sum = result.reduce((acc, i) => acc + i.shareCents, 0);
		expect(sum).toBe(computeSingleTotal(items));
	});
});
