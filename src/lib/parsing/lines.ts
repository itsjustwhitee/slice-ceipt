import { parsePriceCents } from './price';

// Marks the start of the footer (totals/payment/fiscal block); everything
// from the first match onward is discarded. Abbreviated forms (TOT.,
// Pag.) are included since some POS software prints those instead.
// Excludes P.IVA, "DOCUMENTO COMMERCIALE" and "OPERATORE" — real receipts
// print these in the HEADER, not the footer, on some POS systems.
// SUBTOTALE/SUBTOTAL is excluded too: a whole-receipt discount commonly
// follows it before the final TOTALE — see RUNNING_TOTAL_KEYWORDS below.
const FOOTER_KEYWORDS =
	/^\s*(TOT(?:ALE)?\.?|CONTANT[EI]|RESTO|CARTA|BANCOMAT|PAG(?:AMENTO)?\.?|IVA|IMPOSTA|SCONTRINO\s+FISCALE|CASSA|CASSIERE|GRAZIE|ARRIVEDERCI|TOTAL|CASH|CHANGE|VAT|TAX|THANK\s+YOU|VALORE\s+SCONT[OI])\b/i;

// A low-quality photo (background bleeding in past the receipt's edge, a
// faint fold/shadow) often gets OCR'd with a short stray symbol token
// glued onto the front of an otherwise-clean line (e.g. "=
// TOT.COMPLESSIVO 1,00") — real receipt evidence. That defeats the
// anchored match above outright. Stripping a short (<=3 char) leading
// *symbol-only* token before testing is safe: it can never eat into a
// real word (letters/digits are excluded, so e.g. "P. Iva: ..." keeps its
// "P." — stripping that too would misfire, "Iva" alone reading as the IVA
// footer keyword on what's actually a header line), and a real line's own
// first word is essentially always longer than 3 chars anyway.
const LEADING_NOISE = /^\s*[^\w\s]{1,3}\s+/;

/**
 * Cuts a raw line list down to everything before the first footer-keyword
 * line. Unlike `extractItemLines`, keeps priceless lines too, so a name
 * wrapped across OCR lines (see `mergeWrappedNameLines`) can still merge.
 */
export function trimFooter(lines: string[]): string[] {
	const footerIndex = lines.findIndex(
		(line) => FOOTER_KEYWORDS.test(line) || FOOTER_KEYWORDS.test(line.replace(LEADING_NOISE, ''))
	);
	return footerIndex === -1 ? lines : lines.slice(0, footerIndex);
}

/** Item-list lines: footer-trimmed, then filtered to lines with a trailing price. */
export function extractItemLines(lines: string[]): string[] {
	return trimFooter(lines).filter((line) => parsePriceCents(line) !== null);
}

// Shared with discount.ts, which matches this against an already-trimmed
// name (the `^\s*` is redundant there but needed here for raw lines).
export const RUNNING_TOTAL_KEYWORDS = /^\s*(SUBTOTALE|SUBTOTAL)\b/i;

/**
 * discount.ts only needs a running-total line's presence, not its printed
 * amount, but that amount still has to parse for the line to survive
 * extractItemLines' price filter — OCR sometimes mangles it beyond
 * recognition, silently dropping the line and the discount signal after
 * it. Rewrites to a dummy-but-valid price so the marker always survives.
 */
export function normalizeRunningTotalLines(lines: string[]): string[] {
	return lines.map((line) => {
		const match = line.match(RUNNING_TOTAL_KEYWORDS);
		if (!match || parsePriceCents(line) !== null) return line;
		return `${match[0].trim()} 0,00`;
	});
}
