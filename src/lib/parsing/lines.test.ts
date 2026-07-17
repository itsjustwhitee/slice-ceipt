import { describe, expect, it } from 'vitest';
import { extractItemLines } from './lines';

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

TOTALE EURO             8,00
CONTANTE                10,00
RESTO                   2,00
IVA 22%
GRAZIE E ARRIVEDERCI`;

describe('extractItemLines', () => {
	it('drops the header and footer, keeping only priced item/discount lines', () => {
		const lines = ITALIAN_SUPERMARKET_RECEIPT.split('\n');
		const result = extractItemLines(lines);
		expect(result).toEqual([
			'PANE INTEGRALE          2,50',
			'LATTE FRESCO 1L         1,80',
			'BIRRA ICHNUSA 50CL      1,50',
			'BIRRA ICHNUSA 50CL      1,50',
			'BIRRA ICHNUSA 50CL      1,50',
			'SCONTO FEDELTA         -2,00',
			'PASTA BARILLA 500G      1,20'
		]);
	});

	it('handles a receipt with no recognizable footer keyword (uses the whole text)', () => {
		const lines = ['ITEM ONE   1,00', 'ITEM TWO   2,00'];
		expect(extractItemLines(lines)).toEqual(['ITEM ONE   1,00', 'ITEM TWO   2,00']);
	});

	it('handles an English-format receipt', () => {
		const lines = [
			'CORNER STORE INC',
			'123 MAIN ST',
			'',
			'MILK              3.99',
			'BREAD             2.50',
			'',
			'SUBTOTAL          6.49',
			'TAX               0.52',
			'TOTAL             7.01',
			'THANK YOU'
		];
		expect(extractItemLines(lines)).toEqual(['MILK              3.99', 'BREAD             2.50']);
	});

	it('returns an empty array when nothing looks like an item', () => {
		expect(extractItemLines(['STORE NAME', 'ADDRESS LINE'])).toEqual([]);
	});
});
