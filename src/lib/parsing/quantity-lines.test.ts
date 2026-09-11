import { describe, expect, it } from 'vitest';
import { mergeBareQuantityLines, mergeCadQuantityLines } from './quantity-lines';

describe('mergeBareQuantityLines', () => {
	it('merges a bare "N x price" line into the following name line (real coperto-receipt pattern)', () => {
		const result = mergeBareQuantityLines(['        4 x    5,00', 'Coperto                  10,00%        20,00']);
		expect(result).toEqual(['4X Coperto                  10,00%        20,00']);
	});

	it('merges a bare "N x price" line into the preceding name line when there is no usable following line', () => {
		const result = mergeBareQuantityLines(['Caffe\'                                 3,00', '        2 x  1,50']);
		expect(result).toEqual(['2X Caffe\'                                 3,00']);
	});

	it('leaves normal lines (including ones with an inline marker already) untouched', () => {
		const lines = ['PANE INTEGRALE          2,50', '3X BIRRA ICHNUSA 50CL   4,50'];
		expect(mergeBareQuantityLines(lines)).toEqual(lines);
	});

	it('handles several bare-quantity/name pairs in the same receipt independently', () => {
		const result = mergeBareQuantityLines([
			'        2 x  1,50',
			"Caffe'                                 3,00",
			'Bruschetta                             4,00',
			'        2 x  9,50',
			'pizza escobrillo                      19,00'
		]);
		expect(result).toEqual([
			"2X Caffe'                                 3,00",
			'Bruschetta                             4,00',
			'2X pizza escobrillo                      19,00'
		]);
	});

	it('leaves a bare-quantity line with no usable neighbor as-is', () => {
		expect(mergeBareQuantityLines(['        2 x  1,50'])).toEqual(['        2 x  1,50']);
	});

	it('drops a ",00" formatting suffix on the quantity itself (real receipt: "3,00 X 2,50" meaning 3 units, not a fractional count)', () => {
		const result = mergeBareQuantityLines(['3,00 X 2,50', 'Coperto                          10%   7,50']);
		expect(result).toEqual(['3X Coperto                          10%   7,50']);
	});
});

describe('mergeCadQuantityLines', () => {
	it('merges a "Cad <unit price> Pz. <N>" disclosure line into the preceding item line (real Lidl receipt)', () => {
		const result = mergeCadQuantityLines(['COSTINE DI SUINO       10%      8,38', 'Cad 4,19 Pz. 2']);
		expect(result).toEqual(['2X COSTINE DI SUINO       10%      8,38']);
	});

	it('handles several disclosure/item pairs in the same receipt independently', () => {
		const result = mergeCadQuantityLines([
			'COSTINE DI SUINO       10%      8,38',
			'Cad 4,19 Pz. 2',
			'Coupon Lidl Plus -5%   10%     -0,42',
			'PANCETTA A FETTE       10%      5,58',
			'Cad 2,79 Pz. 2'
		]);
		expect(result).toEqual([
			'2X COSTINE DI SUINO       10%      8,38',
			'Coupon Lidl Plus -5%   10%     -0,42',
			'2X PANCETTA A FETTE       10%      5,58'
		]);
	});

	it('leaves a disclosure line with no preceding item as-is (nothing to merge into)', () => {
		expect(mergeCadQuantityLines(['Cad 4,19 Pz. 2'])).toEqual(['Cad 4,19 Pz. 2']);
	});

	it('leaves normal lines untouched', () => {
		const lines = ['PANE INTEGRALE          2,50', '3X BIRRA ICHNUSA 50CL   4,50'];
		expect(mergeCadQuantityLines(lines)).toEqual(lines);
	});
});
