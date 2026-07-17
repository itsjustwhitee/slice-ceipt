import { describe, expect, it } from 'vitest';
import { groupIdenticalItems } from './group';

describe('groupIdenticalItems', () => {
	it('collapses consecutive identical items into one with summed quantity', () => {
		const result = groupIdenticalItems([
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 1 },
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 1 },
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 1 }
		]);
		expect(result).toEqual([{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }]);
	});

	it('does not group items with the same name but different price', () => {
		const result = groupIdenticalItems([
			{ name: 'MELE', unitPriceCents: 150, quantity: 1 },
			{ name: 'MELE', unitPriceCents: 200, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'MELE', unitPriceCents: 150, quantity: 1 },
			{ name: 'MELE', unitPriceCents: 200, quantity: 1 }
		]);
	});

	it('does not group across a non-matching item in between', () => {
		const result = groupIdenticalItems([
			{ name: 'BIRRA', unitPriceCents: 150, quantity: 1 },
			{ name: 'PANE', unitPriceCents: 250, quantity: 1 },
			{ name: 'BIRRA', unitPriceCents: 150, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'BIRRA', unitPriceCents: 150, quantity: 1 },
			{ name: 'PANE', unitPriceCents: 250, quantity: 1 },
			{ name: 'BIRRA', unitPriceCents: 150, quantity: 1 }
		]);
	});

	it('does not group a discounted item with an identically-priced plain neighbor', () => {
		const result = groupIdenticalItems([
			{ name: 'PASTA', unitPriceCents: 100, quantity: 1, originalPriceCents: 120 },
			{ name: 'PASTA', unitPriceCents: 100, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'PASTA', unitPriceCents: 100, quantity: 1, originalPriceCents: 120 },
			{ name: 'PASTA', unitPriceCents: 100, quantity: 1 }
		]);
	});

	it('leaves whole-receipt discount items standalone', () => {
		const result = groupIdenticalItems([
			{ name: 'SCONTO FEDELTA', unitPriceCents: -100, quantity: 1, isWholeReceiptDiscount: true },
			{ name: 'SCONTO FEDELTA', unitPriceCents: -100, quantity: 1, isWholeReceiptDiscount: true }
		]);
		expect(result).toEqual([
			{ name: 'SCONTO FEDELTA', unitPriceCents: -100, quantity: 1, isWholeReceiptDiscount: true },
			{ name: 'SCONTO FEDELTA', unitPriceCents: -100, quantity: 1, isWholeReceiptDiscount: true }
		]);
	});

	it('returns an empty array unchanged', () => {
		expect(groupIdenticalItems([])).toEqual([]);
	});
});
