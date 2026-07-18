import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { currency } from './currency';

describe('currency store', () => {
	it('defaults to EUR', () => {
		expect(get(currency)).toBe('EUR');
	});

	it('can be set to another supported currency', () => {
		currency.set('USD');
		expect(get(currency)).toBe('USD');
		currency.set('EUR');
	});
});
