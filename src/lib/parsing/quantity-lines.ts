// Some restaurant POS systems print an item's quantity/unit-price on its
// own line, above or below the name+total line, e.g. "4 x 5,00" /
// "Coperto  20,00". Without merging, both parse as separate bogus items.
// The quantity itself is sometimes printed with a ",00"/".00" suffix for
// formatting consistency with prices (real receipt: "3,00 X 2,50") — that
// decimal part is dropped, not captured, since a fractional cover count
// makes no sense here.
const BARE_QUANTITY_LINE = /^\s*(\d+)(?:[.,]\d+)?\s*[x×]\s*\d[\d.,]*\d\s*(?:€|EUR)?\s*$/i;

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
