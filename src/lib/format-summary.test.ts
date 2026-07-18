import { describe, expect, it } from 'vitest';
import { formatGroupSummaryText, formatSingleSummaryText } from './format-summary';

describe('formatGroupSummaryText', () => {
	it('formats one block per person with an indented item breakdown', () => {
		const text = formatGroupSummaryText(
			[
				{ name: 'Alice', totalCents: 300, items: [{ name: 'Bread', shareCents: 300 }] },
				{ name: 'Bob', totalCents: 150, items: [{ name: 'Milk', shareCents: 150 }] }
			],
			'EUR',
			'en'
		);
		expect(text).toBe('Alice: €3.00\n  Bread: €3.00\n\nBob: €1.50\n  Milk: €1.50');
	});

	it('formats a person with no itemized items as just the total line', () => {
		const text = formatGroupSummaryText([{ name: 'Alice', totalCents: 0, items: [] }], 'EUR', 'en');
		expect(text).toBe('Alice: €0.00');
	});
});

describe('formatSingleSummaryText', () => {
	it('formats the total followed by an indented item breakdown', () => {
		const text = formatSingleSummaryText(450, [{ name: 'Bread', shareCents: 450 }], 'EUR', 'en');
		expect(text).toBe('€4.50\n  Bread: €4.50');
	});

	it('formats zero items as just the total line', () => {
		const text = formatSingleSummaryText(0, [], 'EUR', 'en');
		expect(text).toBe('€0.00');
	});
});
