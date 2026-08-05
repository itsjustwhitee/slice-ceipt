// Some restaurant POS systems print an item's quantity and per-unit price on
// their own line, with no item name on it at all, directly above (or, less
// commonly, below) the line that has the item's name and its already-
// multiplied total — e.g. "4 x    5,00" / "Coperto            20,00" (4
// covers at €5 each = €20 total), or "2 x  1,50" / "Caffe'        3,00".
// This is a different convention from the inline "4X ITEM   20,00" marker
// `extractNameAndPrice` (parse-line.ts) already understands: there, the
// number after the marker IS the line's own total for the quantity. Here,
// with no marker on the name line itself, that line parses as a standalone
// qty-1 item at its full (correct) total, while the "N x price" line above
// or below it parses as its own bogus item — silently doubling the cost of
// things like coperto.
const BARE_QUANTITY_LINE = /^\s*(\d+)\s*[x×]\s*\d[\d.,]*\d\s*(?:€|EUR)?\s*$/i;

/**
 * Merges a standalone "N x unit price" line into the adjacent line that
 * carries the item's name and total, by prepending an inline "NX" marker to
 * that name line — letting `extractNameAndPrice`'s existing divide-the-
 * total-by-the-quantity logic compute the unit price from the name line's
 * own (correct) total, rather than from the number on the bare-quantity
 * line (which is already a unit price, not a total, and would be divided
 * again if used directly).
 *
 * Prefers the following line (the common case — the quantity is printed
 * above the name), falling back to the preceding one. A bare-quantity line
 * with no usable neighbor is left as-is; it'll parse as its own
 * best-effort (likely wrong) item, no worse off than before this step
 * existed.
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
