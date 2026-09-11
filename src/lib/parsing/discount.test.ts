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

	it('spreads a per-item discount across quantity instead of treating it as per-unit (real Lidl receipt: "COSTINE DI SUINO" x2 @ 8,38 total, "Coupon Lidl Plus" -0,42 total, not per piece)', () => {
		const result = applyDiscounts([
			{ name: 'COSTINE DI SUINO', unitPriceCents: 419, quantity: 2 },
			{ name: 'Coupon Lidl Plus', unitPriceCents: -42, quantity: 1 }
		]);
		expect(result).toEqual([
			{
				name: 'COSTINE DI SUINO',
				unitPriceCents: 398,
				quantity: 2,
				originalPriceCents: 419
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

	it('treats a discount right after a running-total (SUBTOTALE) line as whole-receipt, even when its wording matches no keyword and the preceding item looks like a normal target (real restaurant-receipt pattern: "SUBTOTALE 32,00" / "Sconto % tot 20% -6,40")', () => {
		const result = applyDiscounts([
			{ name: 'MEDIA CHIARA', unitPriceCents: 450, quantity: 1 },
			{ name: 'SUBTOTALE', unitPriceCents: 3200, quantity: 1 },
			{ name: 'Sconto % tot 20%', unitPriceCents: -640, quantity: 1 }
		]);
		expect(result).toEqual([
			{ name: 'MEDIA CHIARA', unitPriceCents: 450, quantity: 1 },
			{
				name: 'Sconto % tot 20%',
				unitPriceCents: -640,
				quantity: 1,
				isWholeReceiptDiscount: true
			}
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
