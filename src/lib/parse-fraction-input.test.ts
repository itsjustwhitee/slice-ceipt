import { describe, expect, it } from 'vitest';
import { parseFractionInput } from './parse-fraction-input';

describe('parseFractionInput', () => {
	it('parses a fraction like "2/5"', () => {
		expect(parseFractionInput('2/5')).toEqual({ num: 2, den: 5 });
	});

	it('parses a percentage like "40%" into num/100', () => {
		expect(parseFractionInput('40%')).toEqual({ num: 40, den: 100 });
	});

	it('trims surrounding whitespace and spaces around the separator', () => {
		expect(parseFractionInput(' 2 / 5 ')).toEqual({ num: 2, den: 5 });
		expect(parseFractionInput(' 40 % ')).toEqual({ num: 40, den: 100 });
	});

	it('rejects a zero or negative fraction/percentage', () => {
		expect(parseFractionInput('0/5')).toBeNull();
		expect(parseFractionInput('-1/5')).toBeNull();
		expect(parseFractionInput('0%')).toBeNull();
		expect(parseFractionInput('-5%')).toBeNull();
	});

	it('rejects a zero denominator', () => {
		expect(parseFractionInput('2/0')).toBeNull();
	});

	it('rejects non-integer fraction parts', () => {
		expect(parseFractionInput('2.5/5')).toBeNull();
	});

	it('rejects input with neither "/" nor "%"', () => {
		expect(parseFractionInput('abc')).toBeNull();
		expect(parseFractionInput('2')).toBeNull();
	});

	it('rejects empty input', () => {
		expect(parseFractionInput('')).toBeNull();
		expect(parseFractionInput('   ')).toBeNull();
	});
});
