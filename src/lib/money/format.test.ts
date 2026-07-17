import { describe, expect, it } from 'vitest';
import { formatCents } from './format';

describe('formatCents', () => {
	it('formats euros in Italian locale', () => {
		expect(formatCents(1234, 'EUR', 'it')).toBe('12,34 €');
	});
	it('formats euros in English locale', () => {
		expect(formatCents(1234, 'EUR', 'en')).toBe('€12.34');
	});
	it('formats US dollars', () => {
		expect(formatCents(1234, 'USD', 'en')).toBe('$12.34');
	});
	it('formats negative amounts', () => {
		expect(formatCents(-150, 'EUR', 'en')).toBe('-€1.50');
	});
	it('formats zero', () => {
		expect(formatCents(0, 'EUR', 'en')).toBe('€0.00');
	});
});
