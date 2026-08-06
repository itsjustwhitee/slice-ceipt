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
});
