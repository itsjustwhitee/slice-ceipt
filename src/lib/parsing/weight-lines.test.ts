import { describe, expect, it } from 'vitest';
import { mergeWeightRows } from './weight-lines';

describe('mergeWeightRows', () => {
	it('merges a bare weight/price-per-kg/total row into the following nameless line (real pizza-by-weight receipt pattern)', () => {
		const result = mergeWeightRows(['PIZZA MARGHERITA', '0.248       12.50        3.10']);
		expect(result).toEqual(['PIZZA MARGHERITA 3.10']);
	});

	it('merges into the preceding nameless line when there is no usable following line', () => {
		const result = mergeWeightRows(['0.186       14.00        2.60', 'PIZZA QUATTRO STAGIONI']);
		expect(result).toEqual(['PIZZA QUATTRO STAGIONI 2.60']);
	});

	it('handles several weight-row/name pairs independently, reconciling the real printed total (7.39)', () => {
		const lines = [
			'PIZZA MARGHERITA',
			'0.248       12.50        3.10',
			'PIZZA QUATTRO STAGIONI',
			'0.186       14.00        2.60',
			'PIZZA MARINARA',
			'0.126       7.50         0.95',
			'PIZZA CAPRICCIOSA',
			'0.098       7.50         0.74'
		];
		expect(mergeWeightRows(lines)).toEqual([
			'PIZZA MARGHERITA 3.10',
			'PIZZA QUATTRO STAGIONI 2.60',
			'PIZZA MARINARA 0.95',
			'PIZZA CAPRICCIOSA 0.74'
		]);
	});

	it('handles the Italian-decimal "kg" / "€/kg" annotated form', () => {
		const result = mergeWeightRows(['MELE GRANNY SMITH', '0,548kg   2,79 €/kg   1,53']);
		expect(result).toEqual(['MELE GRANNY SMITH 1,53']);
	});

	it('leaves normal lines (a name with its own price) untouched', () => {
		const lines = ['PANE INTEGRALE          2,50', 'LATTE FRESCO 1L         1,80'];
		expect(mergeWeightRows(lines)).toEqual(lines);
	});

	it('leaves a weight row with no usable name neighbor as-is', () => {
		const lines = ['0.248       12.50        3.10'];
		expect(mergeWeightRows(lines)).toEqual(lines);
	});

	it('does not treat two consecutive priced item lines as a weight row plus name', () => {
		const lines = ['BIRRA ICHNUSA 50CL      1,50', 'PASTA BARILLA 500G      1,20'];
		expect(mergeWeightRows(lines)).toEqual(lines);
	});
});
