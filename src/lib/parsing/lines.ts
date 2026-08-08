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
// receipts), "SUBTOTALE"/"SUBTOTAL" (a running/partial total printed
// mid-receipt — real receipts commonly print a whole-receipt discount
// *between* this and the final "TOTALE" line, e.g. "SUBTOTALE 32,00" /
// "Sconto % tot 20% -6,40" / "TOTALE EURO 25,60"; treating it as a hard
// cutoff discarded that discount entirely instead of just the running-total
// line itself. It's still excluded from the returned item lines — see
// `RUNNING_TOTAL_KEYWORDS` in discount.ts, which drops it downstream once
// it's had a chance to mark the discount line right after it as
// whole-receipt), and "OPERATORE" (identifies which staff member is
// serving — verified against a real bar/caffetteria receipt: some small
// POS systems print this right after the store's header info, *before*
// the item list, not down by CASSA/CASSIERE in the footer like the more
// common convention. An earlier version matched it unconditionally and
// discarded that receipt's entire item list — "Operatore 10" printed
// directly above "ACQUA 0.50 0,80" x2 — before the parser ever saw it).
const FOOTER_KEYWORDS =
	/^\s*(TOT(?:ALE)?\.?|CONTANT[EI]|RESTO|CARTA|BANCOMAT|PAG(?:AMENTO)?\.?|IVA|IMPOSTA|SCONTRINO\s+FISCALE|CASSA|CASSIERE|GRAZIE|ARRIVEDERCI|TOTAL|CASH|CHANGE|VAT|TAX|THANK\s+YOU)\b/i;

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

// Shared with discount.ts's `applyDiscounts`, which matches this against an
// already-trimmed parsed line name (hence the redundant-looking `^\s*` —
// harmless there, needed here for raw lines that may have leading
// whitespace of their own).
export const RUNNING_TOTAL_KEYWORDS = /^\s*(SUBTOTALE|SUBTOTAL)\b/i;

/**
 * A running-total marker line (see the `SUBTOTALE`/`SUBTOTAL` part of
 * `FOOTER_KEYWORDS`'s comment above) matters to the rest of the pipeline
 * only for its presence, not its own printed amount — `applyDiscounts` in
 * discount.ts uses it purely as a positional signal ("a discount right
 * after this is whole-receipt") and never reads its value. But that value
 * still has to parse as a valid price for the line to survive
 * `extractItemLines`'s trailing-price filter at all, and real OCR
 * sometimes mangles it beyond recognition — e.g. "SUBTOTALE 32,00" coming
 * back as "SUBTOTALE 5200 |" (decimal separator dropped entirely, plus
 * stray trailing noise), which fails to parse as a price and silently
 * drops the whole line, taking the positional signal a whole-receipt
 * discount right after it depends on down with it. Rewriting to a
 * dummy-but-always-valid price keeps the marker alive regardless of how
 * badly its own number got misread.
 */
export function normalizeRunningTotalLines(lines: string[]): string[] {
	return lines.map((line) => {
		const match = line.match(RUNNING_TOTAL_KEYWORDS);
		if (!match || parsePriceCents(line) !== null) return line;
		return `${match[0].trim()} 0,00`;
	});
}
