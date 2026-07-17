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
});
