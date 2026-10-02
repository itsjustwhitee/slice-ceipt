import { describe, expect, it } from 'vitest';
import { extractPrintedTotalCents } from './printed-total';

describe('extractPrintedTotalCents', () => {
	it('finds "TOTALE COMPLESSIVO" (real Lidl receipt)', () => {
		const text = ['COSTINE DI SUINO       10%      8,38', 'SUBTOTALE                      45,52', 'TOTALE COMPLESSIVO             45,52', 'DI CUI IVA                      4,21'].join('\n');
		expect(extractPrintedTotalCents(text)).toBe(4552);
	});

	it('finds "TOTALE EURO" and ignores the earlier SUBTOTALE line', () => {
		const text = ['SUBTOTALE                             32,00', 'TOTALE EURO                           25,60'].join('\n');
		expect(extractPrintedTotalCents(text)).toBe(2560);
	});

	it('finds an English-format "TOTAL" line', () => {
		expect(extractPrintedTotalCents('SUBTOTAL          6.49\nTAX               0.52\nTOTAL             7.01')).toBe(701);
	});

	it('finds an abbreviated "TOT." marker', () => {
		expect(extractPrintedTotalCents('PROFUMI     22%     1,00\nTOT.COMPLESSIVO      1,00')).toBe(100);
	});

	it('tolerates a short stray symbol glued onto the front of the total line (real low-quality-photo receipt)', () => {
		expect(extractPrintedTotalCents('= PROFUMI 22% 1,00\n= TOT.CONPLESSIVO 1,00')).toBe(100);
	});

	it('falls through to a later total line when an earlier one fails to parse (OCR-mangled amount)', () => {
		const text = ['TOTALE COMPLESSIVO garbled', 'TOTALE EURO 25,60'].join('\n');
		expect(extractPrintedTotalCents(text)).toBe(2560);
	});

	it('returns null when no total line is present', () => {
		expect(extractPrintedTotalCents('ITEM ONE   1,00\nITEM TWO   2,00')).toBeNull();
	});

	it('does not mistake SUBTOTALE for the grand total', () => {
		expect(extractPrintedTotalCents('SUBTOTALE   7,98')).toBeNull();
	});
});
