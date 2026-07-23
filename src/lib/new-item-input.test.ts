import { describe, expect, it } from 'vitest';
import { parseNewItemInput } from './new-item-input';

describe('parseNewItemInput', () => {
	it('parses a valid name/price/quantity into cents and an integer quantity', () => {
		expect(parseNewItemInput('Bread', '2.50', '3')).toEqual({
			name: 'Bread',
			unitPriceCents: 250,
			quantity: 3
		});
	});

	it('trims the name', () => {
		expect(parseNewItemInput('  Milk  ', '1.20', '1')).toEqual({
			name: 'Milk',
			unitPriceCents: 120,
			quantity: 1
		});
	});

	it('rejects an empty or whitespace-only name', () => {
		expect(parseNewItemInput('   ', '1.00', '1')).toBeNull();
	});

	it('rejects a non-numeric price', () => {
		expect(parseNewItemInput('Bread', 'abc', '1')).toBeNull();
	});

	it('rejects a zero price', () => {
		expect(parseNewItemInput('Bread', '0', '1')).toBeNull();
	});

	it('accepts a negative price, e.g. a manually entered discount or refund', () => {
		expect(parseNewItemInput('Discount', '-1.50', '1')).toEqual({
			name: 'Discount',
			unitPriceCents: -150,
			quantity: 1
		});
	});

	it('rejects a quantity below 1', () => {
		expect(parseNewItemInput('Bread', '1.00', '0')).toBeNull();
	});

	it('rounds a fractional quantity to the nearest integer', () => {
		expect(parseNewItemInput('Bread', '1.00', '2.4')?.quantity).toBe(2);
	});
});
