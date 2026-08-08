import { describe, expect, it } from 'vitest';
import { parsePriceCents } from './price';

describe('parsePriceCents', () => {
	it('parses simple Italian format', () => {
		expect(parsePriceCents('PANE 2,50')).toBe(250);
	});
	it('parses Italian format with thousands separator', () => {
		expect(parsePriceCents('TOTALE EURO 1.234,56')).toBe(123456);
	});
	it('parses US format', () => {
		expect(parsePriceCents('MILK 3.99')).toBe(399);
	});
	it('parses US format with thousands separator', () => {
		expect(parsePriceCents('TOTAL 1,234.50')).toBe(123450);
	});
	it('parses with trailing euro symbol', () => {
		expect(parsePriceCents('BIRRA 4,50€')).toBe(450);
		expect(parsePriceCents('BIRRA 4,50 €')).toBe(450);
	});
	it('parses a negative discount amount', () => {
		expect(parsePriceCents('SCONTO -0,50')).toBe(-50);
	});
	it('returns null for a line with no price', () => {
		expect(parsePriceCents('SUPERMERCATO ROSSI SRL')).toBeNull();
	});
	it('returns null for a bare integer (e.g. a quantity or PLU code)', () => {
		expect(parsePriceCents('COD 12345')).toBeNull();
		expect(parsePriceCents('3')).toBeNull();
	});
	it('returns null for a percentage', () => {
		expect(parsePriceCents('IVA 22%')).toBeNull();
	});
	it('returns null for a date-like string', () => {
		expect(parsePriceCents('17/07/2026')).toBeNull();
	});
	it('parses zero correctly', () => {
		expect(parsePriceCents('OMAGGIO 0,00')).toBe(0);
	});

	it('treats a curly quote or dash as a minus sign (real OCR misread of a printed "-", confirmed against this project\'s actual Tesseract pipeline)', () => {
		expect(parsePriceCents('Sconto % tot 20% “6,40')).toBe(-640); // "“" = “
		expect(parsePriceCents('SCONTO –6,40')).toBe(-640); // en dash
	});

	it('falls back to treating a colon as the decimal separator when comma/dot parsing fails and the line has a letter (real OCR misread of "," as ":")', () => {
		expect(parsePriceCents('SERVIZIO ACQUA 1:50')).toBe(150);
	});

	it('does not treat a bare digit:digit string with no letters as a price, since it is far more likely to be a timestamp', () => {
		expect(parsePriceCents('21:08')).toBeNull();
		expect(parsePriceCents('15/09/18 21:08')).toBeNull();
	});

	it('tolerates a short tax-category code directly after the price, even though it contains a digit (real receipt format, e.g. "5.29 T1")', () => {
		expect(parsePriceCents('PANOLINI BABY WIPES 72PC 5.29 T1')).toBe(529);
		expect(parsePriceCents('PANOLINI BABY WIPES 20PC 1.95 T1')).toBe(195);
	});

	it('still prefers a later real amount over an earlier one when both are present, since a tax code must start with a letter, not a digit', () => {
		expect(parsePriceCents('PANE 2,50 3,00')).toBe(300);
	});

	it('tolerates a space right after the decimal separator (real OCR misread, e.g. "18, 00" instead of "18,00")', () => {
		expect(parsePriceCents('TROFIE PESTO 10% 18, 00')).toBe(1800);
		expect(parsePriceCents('BIRRA 0, 33 10% 6. 00')).toBe(600);
	});

	it('tolerates a single bare digit directly after the price, since a one-letter VAT-category code (e.g. "B") is sometimes misread as a digit (e.g. "8") — real receipt: "3.06 8" for "3,06 B"', () => {
		expect(parsePriceCents('CAROTE SAN ROCCO IT 3.06 8')).toBe(306);
	});

	it('recovers the real price even when followed by a trailing bare digit that cannot be a price on its own (no decimal separator)', () => {
		expect(parsePriceCents('PANE 2,50 3')).toBe(250);
	});

	it('still prefers a later real (multi-digit, decimal) amount over an earlier one, rather than treating its first digit as trailing noise', () => {
		expect(parsePriceCents('PANE 2,50 30,00')).toBe(3000);
	});
});
