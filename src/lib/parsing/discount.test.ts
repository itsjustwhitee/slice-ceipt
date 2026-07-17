import { describe, expect, it } from 'vitest';
import { applyDiscounts } from './discount';

describe('applyDiscounts', () => {
	it('passes through items with no discount unchanged', () => {
		const result = applyDiscounts([
			{ name: 'PANE', unitPriceCents: 250, quantity: 1 },
			{ name: 'LATTE', unitPriceCents: 180, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'PANE', unitPriceCents: 250, quantity: 1 },
			{ name: 'LATTE', unitPriceCents: 180, quantity: 1 }
		]);
	});

	it('merges a per-item discount into the immediately preceding item', () => {
		const result = applyDiscounts([
			{ name: 'PASTA BARILLA 500G', unitPriceCents: 120, quantity: 1 },
			{ name: 'SCONTO', unitPriceCents: -20, quantity: 1 }
		]);
		expect(result).toEqual([
			{
				name: 'PASTA BARILLA 500G',
				unitPriceCents: 100,
				quantity: 1,
				originalPriceCents: 120
			}
		]);
	});

	it('treats a loyalty-card discount as a whole-receipt item, not merged into the preceding item', () => {
		const result = applyDiscounts([
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 },
			{ name: 'SCONTO FEDELTA', unitPriceCents: -200, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 },
			{
				name: 'SCONTO FEDELTA',
				unitPriceCents: -200,
				quantity: 1,
				isWholeReceiptDiscount: true
			}
		]);
	});

	it('treats a discount as whole-receipt when it is the very first line (nothing to attach to)', () => {
		const result = applyDiscounts([{ name: 'SCONTO CASSA', unitPriceCents: -100, quantity: 1 }]);
		expect(result).toEqual([
			{ name: 'SCONTO CASSA', unitPriceCents: -100, quantity: 1, isWholeReceiptDiscount: true }
		]);
	});

	it('does not merge a second consecutive discount into an already-discounted item', () => {
		const result = applyDiscounts([
			{ name: 'PASTA', unitPriceCents: 120, quantity: 1 },
			{ name: 'SCONTO', unitPriceCents: -20, quantity: 1 },
			{ name: 'SCONTO PROMOZIONE', unitPriceCents: -10, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'PASTA', unitPriceCents: 100, quantity: 1, originalPriceCents: 120 },
			{
				name: 'SCONTO PROMOZIONE',
				unitPriceCents: -10,
				quantity: 1,
				isWholeReceiptDiscount: true
			}
		]);
	});
});
