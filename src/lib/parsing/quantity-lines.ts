// Some restaurant POS systems print an item's quantity/unit-price on its
// own line, above or below the name+total line, e.g. "4 x 5,00" /
// "Coperto  20,00". Without merging, both parse as separate bogus items.
// The quantity itself is sometimes printed with a ",00"/".00" suffix for
// formatting consistency with prices (real receipt: "3,00 X 2,50") — that
// decimal part is dropped, not captured, since a fractional cover count
// makes no sense here.
// A short (≤4 char) leading run of non-digit junk is also tolerated, e.g.
// OCR misreading a border/smudge as "RR 2x 48,00" instead of "2x 48,00" —
// safe because a *real* item name before a marker is always longer and/or
// multi-word (contains a space), which this can't absorb: the run can't
// contain digits or spaces, so it can never eat into the actual quantity.
// The quantity itself is capped at 2 digits: nothing in this app's domain
// (splitting a shared receipt) legitimately has a 3+ digit line quantity,
// but OCR digit corruption produces one easily (e.g. "3" -> "300"), so
// above that it's more likely corruption than a real count and is left
// unmerged rather than risk multiplying a price by a bogus quantity.
// Trailing junk after the price (e.g. "RR 2x 48,00 SHEENA") is tolerated
// the same way TRAILING_AMOUNT does in price.ts, for the same reason: OCR
// noise from the rest of the receipt bleeding onto this line's end.
const BARE_QUANTITY_LINE =
	/^\s*(?:[^\d\s]{1,4}\s+)?(\d{1,2})(?:[.,]\d+)?\s*[x×]\s*\d[\d.,]*\d\s*(?:€|EUR)?\s*(?:[A-Za-z]{1,3}\d{0,2}|\d)?[^\d]*$/i;

/**
 * Merges a bare "N x unit price" line into the adjacent name+total line by
 * prepending an inline "NX" marker, so `extractNameAndPrice`'s existing
 * total÷quantity logic computes the unit price from the name line's own
 * (correct) total. Prefers the following line, falling back to the
 * preceding one.
 */
export function mergeBareQuantityLines(lines: string[]): string[] {
	const isBare = lines.map((line) => BARE_QUANTITY_LINE.test(line));
	const result: string[] = [];
	let skipNext = false;

	for (let i = 0; i < lines.length; i++) {
		if (skipNext) {
			skipNext = false;
			continue;
		}

		const match = lines[i].match(BARE_QUANTITY_LINE);
		if (!match) {
			result.push(lines[i]);
			continue;
		}

		const quantity = match[1];

		if (i + 1 < lines.length && !isBare[i + 1]) {
			result.push(`${quantity}X ${lines[i + 1]}`);
			skipNext = true;
			continue;
		}

		if (result.length > 0) {
			result[result.length - 1] = `${quantity}X ${result[result.length - 1]}`;
			continue;
		}

		result.push(lines[i]);
	}

	return result;
}

// Discount supermarkets disclose a multi-piece item's per-unit price and
// count on their own line right after the item's name+total line, e.g.
// "COSTINE DI SUINO 10% 8,38" / "Cad 4,19 Pz. 2" (real Lidl receipt: "Cad" =
// "cadauno"/each, "Pz." = "pezzi"/pieces). Unlike BARE_QUANTITY_LINE this
// always trails its item rather than leading it, so it must merge backward
// only — there's no "prefer the following line" case here, the line after
// is always the next item's own discount/name line, never part of this one.
const CAD_QUANTITY_LINE = /^\s*Cad\.?\s+\d+[.,]\d{2}\s*(?:€|EUR)?\s+Pz\.?\s*(\d{1,2})\s*$/i;

/**
 * Merges a "Cad <unit price> Pz. <N>" disclosure line into the item line
 * just before it by prepending an "NX" marker, the same convention
 * `mergeBareQuantityLines` uses, so `extractNameAndPrice` recovers the real
 * per-unit price/quantity instead of leaving the item at quantity 1. Must
 * run before `mergeWrappedNameLines`, which would otherwise treat this
 * priceless line as an orphaned name fragment and silently drop it.
 */
export function mergeCadQuantityLines(lines: string[]): string[] {
	const result: string[] = [];

	for (const line of lines) {
		const match = line.match(CAD_QUANTITY_LINE);
		if (match && result.length > 0) {
			result[result.length - 1] = `${match[1]}X ${result[result.length - 1]}`;
			continue;
		}
		result.push(line);
	}

	return result;
}
