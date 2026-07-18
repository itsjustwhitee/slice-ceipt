import { describe, expect, it } from 'vitest';
import { extractNameAndPrice } from './parse-line';

describe('extractNameAndPrice', () => {
	it('extracts name and price with no quantity marker', () => {
		expect(extractNameAndPrice('PANE INTEGRALE          2,50')).toEqual({
			name: 'PANE INTEGRALE',
			unitPriceCents: 250,
			quantity: 1
		});
	});

	it('matches idea.md example exactly: "3x Birra Ichnusa 50cl" at 4,50 total -> 1,50/unit, qty 3', () => {
		expect(extractNameAndPrice('3X BIRRA ICHNUSA 50CL   4,50')).toEqual({
			name: 'BIRRA ICHNUSA 50CL',
			unitPriceCents: 150,
			quantity: 3
		});
	});

	it('handles the marker after the name (X3 style)', () => {
		expect(extractNameAndPrice('BIRRA ICHNUSA 50CL X3   4,50')).toEqual({
			name: 'BIRRA ICHNUSA 50CL',
			unitPriceCents: 150,
			quantity: 3
		});
	});

	it('handles "PZ" style marker', () => {
		expect(extractNameAndPrice('ACQUA NATURALE 3 PZ     1,50')).toEqual({
			name: 'ACQUA NATURALE',
			unitPriceCents: 50,
			quantity: 3
		});
	});

	it('handles "Q.TA" style marker (digit AFTER the keyword, unlike X/PZ)', () => {
		expect(extractNameAndPrice('YOGURT Q.TA 2            2,00')).toEqual({
			name: 'YOGURT',
			unitPriceCents: 100,
			quantity: 2
		});
	});

	it('rounds when the total does not divide evenly by quantity', () => {
		const result = extractNameAndPrice('MELE 3X                  5,00');
		expect(result?.quantity).toBe(3);
		expect(result?.unitPriceCents).toBe(167); // 500/3 = 166.67 -> rounds to 167
	});

	it('returns null for a line with no price', () => {
		expect(extractNameAndPrice('SUPERMERCATO ROSSI SRL')).toBeNull();
	});

	it('extracts a negative (discount) line as-is, quantity 1', () => {
		expect(extractNameAndPrice('SCONTO FEDELTA         -2,00')).toEqual({
			name: 'SCONTO FEDELTA',
			unitPriceCents: -200,
			quantity: 1
		});
	});

	it('strips a trailing per-line VAT rate printed between the name and the price (real Italian receipt format)', () => {
		expect(extractNameAndPrice('PASSATA DI POMODOR 4,00% 0,99')).toEqual({
			name: 'PASSATA DI POMODOR',
			unitPriceCents: 99,
			quantity: 1
		});
	});

	it('strips a trailing VAT rate on a discount line too', () => {
		expect(extractNameAndPrice('SCONTO % CLIENTI 40,00% 4,00% -1,40')).toEqual({
			name: 'SCONTO % CLIENTI 40,00%',
			unitPriceCents: -140,
			quantity: 1
		});
	});

	it('does not strip a number that only coincidentally looks like a VAT rate but has no percent sign', () => {
		expect(extractNameAndPrice('CACIOT MISTO MONTE 4,00        5,90')).toEqual({
			name: 'CACIOT MISTO MONTE 4,00',
			unitPriceCents: 590,
			quantity: 1
		});
	});
});
