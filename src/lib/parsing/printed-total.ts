import { parsePriceCents } from './price';
import { LEADING_NOISE } from './lines';

// Deliberately narrower than lines.ts's FOOTER_KEYWORDS: this is only meant
// to find the receipt's own grand-total line, so it must not match
// CONTANTE/RESTO/IVA/etc, and must not match SUBTOTALE/SUBTOTAL either
// (anchored at the start, so "SUB..." never matches a "TOT..." pattern to
// begin with). "TOTAL" is a separate alternative from "TOT(?:ALE)?" for the
// same reason as FOOTER_KEYWORDS: "TOT(?:ALE)?" alone can't match "TOTAL"
// (the optional group only matches the full "ALE", never just "AL").
const GRAND_TOTAL_KEYWORDS = /^\s*(?:TOT(?:ALE)?\.?|TOTAL)\b/i;

/**
 * Scans raw OCR/text-layer lines (before `trimFooter` discards the footer
 * block) for the receipt's own printed grand total, e.g. "TOTALE
 * COMPLESSIVO 45,52" or "TOTAL 7.01". Used to sanity-check
 * `parseReceiptText`'s output against the receipt's own claimed total,
 * independent of how the items themselves were parsed. Returns the first
 * matching line whose amount actually parses — OCR can mangle one
 * total-labeled line (e.g. a stray "TOT." from a subtitle) while a later,
 * cleaner one still holds the real number — or `null` if none do.
 */
export function extractPrintedTotalCents(rawText: string): number | null {
	for (const line of rawText.split('\n')) {
		const isGrandTotal =
			GRAND_TOTAL_KEYWORDS.test(line) || GRAND_TOTAL_KEYWORDS.test(line.replace(LEADING_NOISE, ''));
		if (!isGrandTotal) continue;

		const cents = parsePriceCents(line);
		if (cents !== null) return cents;
	}
	return null;
}
