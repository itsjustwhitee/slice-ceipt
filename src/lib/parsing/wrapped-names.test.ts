import { describe, expect, it } from 'vitest';
import { mergeWrappedNameLines } from './wrapped-names';

describe('mergeWrappedNameLines', () => {
	it('joins a name wrapped across two lines onto its (otherwise nameless) price line (real restaurant-receipt pattern)', () => {
		const result = mergeWrappedNameLines(['Rombo Yakitori alla "Mugn', 'aia"', '10,00% 50,00']);
		expect(result).toEqual(['Rombo Yakitori alla "Mugn aia" 10,00% 50,00']);
	});

	it('joins a name wrapped across three or more lines', () => {
		const result = mergeWrappedNameLines(['Filetto di manzo', 'al pepe verde', 'con patate', '10,00% 35,00']);
		expect(result).toEqual(['Filetto di manzo al pepe verde con patate 10,00% 35,00']);
	});

	it('leaves ordinary single-line items untouched', () => {
		const lines = ['Bruschetta                             4,00', 'MEDIA CHIARA                           4,50'];
		expect(mergeWrappedNameLines(lines)).toEqual(lines);
	});

	it('does not attach unrelated priceless lines (e.g. a column-header row) to the next item, since that item already has its own name', () => {
		const result = mergeWrappedNameLines([
			'DESCRIZIONE              IVA        Prezzo(€)',
			'Coperto                  10,00%        20,00'
		]);
		expect(result).toEqual(['Coperto                  10,00%        20,00']);
	});

	it('drops a trailing priceless line with nothing after it to claim it', () => {
		expect(mergeWrappedNameLines(['Rombo Yakitori alla "Mugn', 'aia"'])).toEqual([]);
	});

	it('ignores blank lines when buffering fragments', () => {
		const result = mergeWrappedNameLines([
			'Rombo Yakitori alla "Mugn',
			'',
			'aia"',
			'10,00% 50,00'
		]);
		expect(result).toEqual(['Rombo Yakitori alla "Mugn aia" 10,00% 50,00']);
	});
});
