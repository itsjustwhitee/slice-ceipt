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

	it('collapses repeated internal whitespace in a name with no quantity marker', () => {
		expect(extractNameAndPrice('PANE    INTEGRALE   2,50')).toEqual({
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

	it('does NOT treat a digit-after-"X" suffix as a quantity marker, since it is often a product/pack-size code rather than a checkout multiplier (real Coop receipt: "DANACOL BIANCO X8" priced as one €5.90 pack, not 8 units at ~0.74 each)', () => {
		expect(extractNameAndPrice('DANACOL BIANCO X8   5,90')).toEqual({
			name: 'DANACOL BIANCO X8',
			unitPriceCents: 590,
			quantity: 1
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

	it('strips a trailing VAT rate even when the extracted text has a space after the decimal separator (real receipt quirk, e.g. "4, 00%")', () => {
		expect(extractNameAndPrice('M-T POMOD. DATT F. FIORE 4, 00% 6,96')).toEqual({
			name: 'M-T POMOD. DATT F. FIORE',
			unitPriceCents: 696,
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

	it('strips a price with an OCR-misread colon decimal separator from the name too, not just its value (real receipt quirk, e.g. "1,50" read as "1:50")', () => {
		expect(extractNameAndPrice('SERVIZIO ACQUA 1:50')).toEqual({
			name: 'SERVIZIO ACQUA',
			unitPriceCents: 150,
			quantity: 1
		});
	});

	it('strips a price with an OCR-misread curly-quote minus sign from the name too, not just its value', () => {
		expect(extractNameAndPrice('Sconto % tot 20% “6,40')).toEqual({
			name: 'Sconto % tot 20%',
			unitPriceCents: -640,
			quantity: 1
		});
	});

	it('strips a trailing tax-category code (and the price) from the name, leaving just the item name (real receipt format, e.g. "5.29 T1")', () => {
		expect(extractNameAndPrice('PANOLINI BABY WIPES 72PC 5.29 T1')).toEqual({
			name: 'PANOLINI BABY WIPES 72PC',
			unitPriceCents: 529,
			quantity: 1
		});
	});
});
