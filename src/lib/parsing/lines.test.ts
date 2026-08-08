import { describe, expect, it } from 'vitest';
import { extractItemLines } from './lines';

const ITALIAN_SUPERMARKET_RECEIPT = `SUPERMERCATO ROSSI SRL
VIA ROMA 123, MILANO
P.IVA 12345678901
17/07/2026 14:32

PANE INTEGRALE          2,50
LATTE FRESCO 1L         1,80
BIRRA ICHNUSA 50CL      1,50
BIRRA ICHNUSA 50CL      1,50
BIRRA ICHNUSA 50CL      1,50
SCONTO FEDELTA         -2,00
PASTA BARILLA 500G      1,20

TOTALE EURO             8,00
CONTANTE                10,00
RESTO                   2,00
IVA 22%
GRAZIE E ARRIVEDERCI`;

describe('extractItemLines', () => {
	it('drops the header and footer, keeping only priced item/discount lines', () => {
		const lines = ITALIAN_SUPERMARKET_RECEIPT.split('\n');
		const result = extractItemLines(lines);
		expect(result).toEqual([
			'PANE INTEGRALE          2,50',
			'LATTE FRESCO 1L         1,80',
			'BIRRA ICHNUSA 50CL      1,50',
			'BIRRA ICHNUSA 50CL      1,50',
			'BIRRA ICHNUSA 50CL      1,50',
			'SCONTO FEDELTA         -2,00',
			'PASTA BARILLA 500G      1,20'
		]);
	});

	it('handles a receipt with no recognizable footer keyword (uses the whole text)', () => {
		const lines = ['ITEM ONE   1,00', 'ITEM TWO   2,00'];
		expect(extractItemLines(lines)).toEqual(['ITEM ONE   1,00', 'ITEM TWO   2,00']);
	});

	it('handles an English-format receipt, keeping the SUBTOTAL line itself (a whole-receipt discount can follow it before TAX/TOTAL — see discount.ts)', () => {
		const lines = [
			'CORNER STORE INC',
			'123 MAIN ST',
			'',
			'MILK              3.99',
			'BREAD             2.50',
			'',
			'SUBTOTAL          6.49',
			'TAX               0.52',
			'TOTAL             7.01',
			'THANK YOU'
		];
		expect(extractItemLines(lines)).toEqual([
			'MILK              3.99',
			'BREAD             2.50',
			'SUBTOTAL          6.49'
		]);
	});

	it('returns an empty array when nothing looks like an item', () => {
		expect(extractItemLines(['STORE NAME', 'ADDRESS LINE'])).toEqual([]);
	});

	it('does not treat "DOCUMENTO COMMERCIALE" as a footer marker, since modern Italian receipts print it as a HEADER title (post-2020 e-receipt reform), not a footer one', () => {
		const lines = [
			'COOP ALLEANZA 3.0 Soc. Coop.',
			'Via Copparo, 132 - 44123 FERRARA (FE)',
			'P.I. e C.F. 03503411203',
			'',
			'DOCUMENTO COMMERCIALE',
			'di vendita o prestazione',
			'PASSATA DI POMODORO       0,99',
			'TONNO OLIO OLIVA          6,99',
			'',
			'SUBTOTALE                 7,98',
			'TOTALE COMPLESSIVO         7,98'
		];
		expect(extractItemLines(lines)).toEqual([
			'PASSATA DI POMODORO       0,99',
			'TONNO OLIO OLIVA          6,99',
			'SUBTOTALE                 7,98'
		]);
	});

	it('stops at an abbreviated "TOT." footer marker, not just the full "TOTALE" word (real receipt quirk)', () => {
		const lines = ['PROFUMI     22%     1,00', 'TOT.COMPLESSIVO      1,00', 'di cui IVA            0,18'];
		expect(extractItemLines(lines)).toEqual(['PROFUMI     22%     1,00']);
	});

	it('stops at an abbreviated "Pag." footer marker, not just the full "PAGAMENTO" word (real receipt quirk)', () => {
		const lines = ['ITEM ONE   1,00', 'Pag.contante   1,00', 'Resto   0,00'];
		expect(extractItemLines(lines)).toEqual(['ITEM ONE   1,00']);
	});

	it('does not mistake an item name starting with "TOT" or "PAG" for a footer marker', () => {
		const lines = ['TOTANI FRESCHI       3,50', 'PAGELLA REGALO       2,00'];
		expect(extractItemLines(lines)).toEqual(['TOTANI FRESCHI       3,50', 'PAGELLA REGALO       2,00']);
	});

	it('does not treat "Operatore" as a footer marker, since some small POS systems (bars/caffetterie) print it right above the item list, not down by CASSA/CASSIERE in the footer (real receipt quirk)', () => {
		const lines = [
			'BAR GUGLIELMO',
			'di Angela Critelli',
			'Piazza Stazione - 88100 Catanzaro Lido',
			"P.Iva IT 02753370796",
			'Operatore 10',
			'ACQUA 0.50            0,80',
			'ACQUA 0.50            0,80',
			'TOTALE EURO            1,60',
			'CONTANTI                1,60'
		];
		expect(extractItemLines(lines)).toEqual(['ACQUA 0.50            0,80', 'ACQUA 0.50            0,80']);
	});
});
