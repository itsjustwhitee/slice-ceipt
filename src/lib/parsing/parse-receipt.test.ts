import { describe, expect, it } from 'vitest';
import { parseReceiptText } from './parse-receipt';

const ITALIAN_SUPERMARKET_RECEIPT = `SUPERMERCATO ROSSI SRL
VIA ROMA 123, MILANO
P.IVA 12345678901
17/07/2026 14:32

PANE INTEGRALE          2,50
LATTE FRESCO 1L         1,80
BIRRA ICHNUSA 50CL      1,50
BIRRA ICHNUSA 50CL      1,50
BIRRA ICHNUSA 50CL      1,50
SCONTO FEDELTA         -2,00
PASTA BARILLA 500G      1,20
SCONTO                 -0,20

TOTALE EURO             7,80
CONTANTE                10,00
RESTO                   2,20
IVA 22%
GRAZIE E ARRIVEDERCI`;

describe('parseReceiptText end-to-end', () => {
	it('parses a realistic Italian supermarket receipt into the expected items', () => {
		const items = parseReceiptText(ITALIAN_SUPERMARKET_RECEIPT);

		expect(items).toEqual([
			{ name: 'PANE INTEGRALE', unitPriceCents: 250, quantity: 1 },
			{ name: 'LATTE FRESCO 1L', unitPriceCents: 180, quantity: 1 },
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 },
			{
				name: 'SCONTO FEDELTA',
				unitPriceCents: -200,
				quantity: 1,
				isWholeReceiptDiscount: true
			},
			{
				name: 'PASTA BARILLA 500G',
				unitPriceCents: 100,
				quantity: 1,
				originalPriceCents: 120
			}
		]);
	});

	it('reconciles against the printed total', () => {
		const items = parseReceiptText(ITALIAN_SUPERMARKET_RECEIPT);
		const sum = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
		expect(sum).toBe(780); // matches "TOTALE EURO 7,80" in the fixture
	});

	it('handles the idea.md 3x-beer aggregate-line style instead of repeated lines', () => {
		const receipt = `NEGOZIO\n\n3X BIRRA ICHNUSA 50CL    4,50\n\nTOTALE                   4,50`;
		const items = parseReceiptText(receipt);
		expect(items).toEqual([{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }]);
	});

	it('falls back to manual entry gracefully: unparseable text yields an empty list, not a crash', () => {
		expect(parseReceiptText('not a receipt at all\njust some words')).toEqual([]);
	});

	it('handles an English-format receipt end-to-end', () => {
		const receipt = `CORNER STORE\n\nMILK              3.99\nBREAD             2.50\n\nSUBTOTAL          6.49\nTAX               0.52\nTOTAL             7.01`;
		const items = parseReceiptText(receipt);
		expect(items).toEqual([
			{ name: 'MILK', unitPriceCents: 399, quantity: 1 },
			{ name: 'BREAD', unitPriceCents: 250, quantity: 1 }
		]);
	});
});
