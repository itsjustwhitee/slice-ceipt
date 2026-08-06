import { describe, expect, it } from 'vitest';
import { parseReceiptText } from './parse-receipt';

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
SCONTO                 -0,20

TOTALE EURO             7,80
CONTANTE                10,00
RESTO                   2,20
IVA 22%
GRAZIE E ARRIVEDERCI`;

describe('parseReceiptText end-to-end', () => {
	it('parses a realistic Italian supermarket receipt into the expected items', () => {
		const items = parseReceiptText(ITALIAN_SUPERMARKET_RECEIPT);

		expect(items).toEqual([
			{ name: 'PANE INTEGRALE', unitPriceCents: 250, quantity: 1 },
			{ name: 'LATTE FRESCO 1L', unitPriceCents: 180, quantity: 1 },
			{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 },
			{
				name: 'SCONTO FEDELTA',
				unitPriceCents: -200,
				quantity: 1,
				isWholeReceiptDiscount: true
			},
			{
				name: 'PASTA BARILLA 500G',
				unitPriceCents: 100,
				quantity: 1,
				originalPriceCents: 120
			}
		]);
	});

	it('reconciles against the printed total', () => {
		const items = parseReceiptText(ITALIAN_SUPERMARKET_RECEIPT);
		const sum = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
		expect(sum).toBe(780); // matches "TOTALE EURO 7,80" in the fixture
	});

	it('handles the idea.md 3x-beer aggregate-line style instead of repeated lines', () => {
		const receipt = `NEGOZIO\n\n3X BIRRA ICHNUSA 50CL    4,50\n\nTOTALE                   4,50`;
		const items = parseReceiptText(receipt);
		expect(items).toEqual([{ name: 'BIRRA ICHNUSA 50CL', unitPriceCents: 150, quantity: 3 }]);
	});

	it('falls back to manual entry gracefully: unparseable text yields an empty list, not a crash', () => {
		expect(parseReceiptText('not a receipt at all\njust some words')).toEqual([]);
	});

	it('captures a whole-receipt percentage discount printed after SUBTOTALE, and merges standalone "N x price" lines into the coperto/drinks lines above them (real restaurant-receipt pattern)', () => {
		const receipt = [
			'ESCOBRILLO di Savoretti Fabio',
			'VIA TOMMASO FORTIFIOCCA 68',
			'ROMA  P.IVA 12403071009',
			'TEL. +39-06-77811772',
			'',
			'TAVOLO14                              EURO',
			'OP: OPERATORE7',
			'        2 x  1,50',
			"Caffe'                                 3,00",
			'Bruschetta                             4,00',
			'        2 x  9,50',
			'pizza escobrillo                      19,00',
			'SERVIZIO ACQUA                         1,50',
			'MEDIA CHIARA                           4,50',
			'SUBTOTALE                             32,00',
			'Sconto % tot  20%                     -6,40',
			'TOTALE EURO                           25,60',
			'CONTANTI                              25,60',
			'Resto                                  0,00'
		].join('\n');

		const items = parseReceiptText(receipt);

		expect(items).toEqual([
			{ name: "Caffe'", unitPriceCents: 150, quantity: 2 },
			{ name: 'Bruschetta', unitPriceCents: 400, quantity: 1 },
			{ name: 'pizza escobrillo', unitPriceCents: 950, quantity: 2 },
			{ name: 'SERVIZIO ACQUA', unitPriceCents: 150, quantity: 1 },
			{ name: 'MEDIA CHIARA', unitPriceCents: 450, quantity: 1 },
			{
				name: 'Sconto % tot 20%',
				unitPriceCents: -640,
				quantity: 1,
				isWholeReceiptDiscount: true
			}
		]);

		const sum = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
		expect(sum).toBe(2560); // matches "TOTALE EURO 25,60" in the fixture
	});

	it('merges standalone "N x price" coperto-style lines end-to-end without inflating the total (real restaurant-receipt pattern)', () => {
		const receipt = [
			'Ristorante Da Esempio',
			'Via Roma 1',
			'',
			'DOCUMENTO COMMERCIALE',
			'di vendita o prestazione',
			'',
			'DESCRIZIONE              IVA        Prezzo(€)',
			'        4 x    5,00',
			'Coperto                  10,00%        20,00',
			'        3 x    5,00',
			'Acqua                    10,00%        15,00',
			'Bibita                   10,00%         6,00',
			'        2 x   10,00',
			'Calice Vino 10                         20,00',
			'Pasta al Pomodoro        10,00%        30,00',
			'',
			'TOTALE COMPLESSIVO                    91,00',
			'di cui IVA                             8,27',
			'',
			'Pagamento contante                    91,00'
		].join('\n');

		const items = parseReceiptText(receipt);

		expect(items).toEqual([
			{ name: 'Coperto', unitPriceCents: 500, quantity: 4 },
			{ name: 'Acqua', unitPriceCents: 500, quantity: 3 },
			{ name: 'Bibita', unitPriceCents: 600, quantity: 1 },
			{ name: 'Calice Vino 10', unitPriceCents: 1000, quantity: 2 },
			{ name: 'Pasta al Pomodoro', unitPriceCents: 3000, quantity: 1 }
		]);

		const sum = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
		expect(sum).toBe(9100); // matches "TOTALE COMPLESSIVO 91,00" in the fixture
	});

	it('handles bare weight/price-per-kg/total rows end-to-end, recovering the real names instead of "0.248 12.50"-style garbage (real pizza-by-weight receipt pattern)', () => {
		const receipt = [
			'PIZZAMANIA',
			'DI FRANZI E CLAUDIA',
			'',
			'R01  *13/14   B00   0007',
			'U01',
			'kg          €/kg          €',
			'',
			'PIZZA MARGHERITA',
			'0.248       12.50        3.10',
			'PIZZA QUATTRO STAGIONI',
			'0.186       14.00        2.60',
			'PIZZA MARINARA',
			'0.126       7.50         0.95',
			'PIZZA CAPRICCIOSA',
			'0.098       7.50         0.74',
			'',
			'TOTALE                   7.39',
			'CONTANTI                 7.39'
		].join('\n');

		const items = parseReceiptText(receipt);

		expect(items).toEqual([
			{ name: 'PIZZA MARGHERITA', unitPriceCents: 310, quantity: 1 },
			{ name: 'PIZZA QUATTRO STAGIONI', unitPriceCents: 260, quantity: 1 },
			{ name: 'PIZZA MARINARA', unitPriceCents: 95, quantity: 1 },
			{ name: 'PIZZA CAPRICCIOSA', unitPriceCents: 74, quantity: 1 }
		]);

		const sum = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
		expect(sum).toBe(739); // matches "04 x € 7.39" in the fixture
	});

	it('handles an English-format receipt end-to-end', () => {
		const receipt = `CORNER STORE\n\nMILK              3.99\nBREAD             2.50\n\nSUBTOTAL          6.49\nTAX               0.52\nTOTAL             7.01`;
		const items = parseReceiptText(receipt);
		expect(items).toEqual([
			{ name: 'MILK', unitPriceCents: 399, quantity: 1 },
			{ name: 'BREAD', unitPriceCents: 250, quantity: 1 }
		]);
	});
});
