import { parsePriceCents } from './price';

// Lines starting with any of these (case-insensitive) mark the start of the
// receipt's footer block (totals, payment, fiscal info) — everything from
// the first match onward is discarded, even though some of these lines
// (e.g. "TOTALE EURO 45,67") also match the trailing-price pattern and
// would otherwise look like an item line.
//
// "TOT(?:ALE)?\.?" and "PAG(?:AMENTO)?\.?" (rather than plain "TOTALE"/
// "PAGAMENTO") also match the abbreviated forms some POS software prints
// instead of the full word (e.g. "TOT.COMPLESSIVO", "Pag.contante") — a
// real receipt using these abbreviations was falling through the original
// exact-word match entirely, which let the whole totals/payment block leak
// through as bogus items instead of being trimmed.
//
// Deliberately excludes "P.IVA" (the store's own VAT registration number,
// which appears in the HEADER, not the footer — an earlier version matched
// it and incorrectly truncated the item region to nothing on every receipt
// that prints it, which is effectively all of them), "DOCUMENTO
// COMMERCIALE" (the mandatory title Italian receipts have printed at the
// TOP since the 2020 "scontrino elettronico" reform, not the bottom — an
// earlier version matched it and truncated the item region to nothing on
// every receipt using this now-standard format, i.e. most real Italian
// receipts), and "SUBTOTALE"/"SUBTOTAL" (a running/partial total printed
// mid-receipt — real receipts commonly print a whole-receipt discount
// *between* this and the final "TOTALE" line, e.g. "SUBTOTALE 32,00" /
// "Sconto % tot 20% -6,40" / "TOTALE EURO 25,60"; treating it as a hard
// cutoff discarded that discount entirely instead of just the running-total
// line itself. It's still excluded from the returned item lines — see
// `RUNNING_TOTAL_KEYWORDS` in discount.ts, which drops it downstream once
// it's had a chance to mark the discount line right after it as
// whole-receipt).
const FOOTER_KEYWORDS =
	/^\s*(TOT(?:ALE)?\.?|CONTANT[EI]|RESTO|CARTA|BANCOMAT|PAG(?:AMENTO)?\.?|IVA|IMPOSTA|SCONTRINO\s+FISCALE|OPERATORE|CASSA|CASSIERE|GRAZIE|ARRIVEDERCI|TOTAL|CASH|CHANGE|VAT|TAX|THANK\s+YOU)\b/i;

/**
 * Cuts a raw OCR/text-layer line list down to everything before the first
 * footer-keyword line (totals/payment/fiscal block) — unlike
 * `extractItemLines`, this does NOT also drop lines with no price, so
 * header-region lines that legitimately belong to an item (e.g. a name
 * wrapped across two OCR lines, each with no price of its own — see
 * `mergeWrappedNameLines`) survive long enough to be merged before
 * anything filters them out.
 */
export function trimFooter(lines: string[]): string[] {
	const footerIndex = lines.findIndex((line) => FOOTER_KEYWORDS.test(line));
	return footerIndex === -1 ? lines : lines.slice(0, footerIndex);
}

/**
 * Extracts the subset of raw OCR/text lines that make up the item list:
 * everything before the first footer-keyword line (totals/payment/fiscal
 * block), further filtered to only lines that have a trailing price —
 * this drops the header (store name/address/date, which typically has no
 * trailing price) without needing to separately search for where the list
 * "starts". A running-total line (SUBTOTALE) is deliberately NOT a cutoff
 * point, since a whole-receipt discount commonly follows it before the
 * final total — see the comment on `FOOTER_KEYWORDS` above.
 */
export function extractItemLines(lines: string[]): string[] {
	return trimFooter(lines).filter((line) => parsePriceCents(line) !== null);
}
