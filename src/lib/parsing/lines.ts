import { parsePriceCents } from './price';

// Lines starting with any of these (case-insensitive) mark the start of the
// receipt's footer block (totals, payment, fiscal info) — everything from
// the first match onward is discarded, even though some of these lines
// (e.g. "TOTALE EURO 45,67") also match the trailing-price pattern and
// would otherwise look like an item line.
//
// Deliberately excludes "P.IVA" (the store's own VAT registration number,
// which appears in the HEADER, not the footer — an earlier version matched
// it and incorrectly truncated the item region to nothing on every receipt
// that prints it, which is effectively all of them) and "DOCUMENTO
// COMMERCIALE" (the mandatory title Italian receipts have printed at the
// TOP since the 2020 "scontrino elettronico" reform, not the bottom — an
// earlier version matched it and truncated the item region to nothing on
// every receipt using this now-standard format, i.e. most real Italian
// receipts).
const FOOTER_KEYWORDS =
	/^\s*(TOTALE|SUBTOTALE|CONTANTE|RESTO|CARTA|BANCOMAT|PAGAMENTO|IVA|IMPOSTA|SCONTRINO\s+FISCALE|OPERATORE|CASSA|CASSIERE|GRAZIE|ARRIVEDERCI|SUBTOTAL|TOTAL|CASH|CHANGE|VAT|TAX|THANK\s+YOU)\b/i;

/**
 * Extracts the subset of raw OCR/text lines that make up the item list:
 * everything before the first footer-keyword line (totals/payment/fiscal
 * block), further filtered to only lines that have a trailing price —
 * this drops the header (store name/address/date, which typically has no
 * trailing price) without needing to separately search for where the list
 * "starts".
 */
export function extractItemLines(lines: string[]): string[] {
	const footerIndex = lines.findIndex((line) => FOOTER_KEYWORDS.test(line));
	const region = footerIndex === -1 ? lines : lines.slice(0, footerIndex);
	return region.filter((line) => parsePriceCents(line) !== null);
}
