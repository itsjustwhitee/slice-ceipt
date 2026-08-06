import { parsePriceCents } from './price';

// A weighed item's row on some receipts (bakeries, delis, pizza-by-weight
// counters) is three bare numbers — weight, price per kg, and the
// already-multiplied total — with no item name on the row at all, e.g.
// "0.248       12.50        3.10" (0.248kg at €12.50/kg = €3.10). The name
// lives on its own separate line with no price on it. Without special
// handling, `extractItemLines` keeps this numbers-only row (it has a valid
// trailing price) but drops the actual name line (no price on it to match),
// producing a bogus item literally named "0.248 12.50" and losing the real
// product name entirely.
const WEIGHT_ROW =
	/^\s*\d+(?:[.,]\d+)?\s*(?:kg)?\s+\d+(?:[.,]\d+)?\s*(?:€|EUR)?(?:\s*\/\s*kg)?\s+(-?\d+[.,]\d{2})\s*(?:€|EUR)?\s*$/i;

function isPlainNameLine(line: string): boolean {
	const trimmed = line.trim();
	return trimmed !== '' && parsePriceCents(trimmed) === null && !WEIGHT_ROW.test(trimmed);
}

/**
 * Merges a bare "weight / price-per-kg / total" row into the adjacent line
 * that has the item's name and no price of its own, by appending the row's
 * own (correct) total to that name — turning it into an ordinary
 * "name total" line the rest of the pipeline already knows how to parse,
 * as a qty-1 item (a weighed lot is one physical piece for splitting
 * purposes, same as any other single item).
 *
 * Must run on the raw lines *before* `extractItemLines`, since the name
 * line has no price of its own and would otherwise be dropped by its
 * trailing-price filter before this merge ever saw it.
 *
 * Prefers the preceding line (the line just pushed to `result`) over the
 * following one: it's the safer default when several weight rows are
 * chained with their names, since the "next" line is only a safe merge
 * target when it hasn't already been claimed as *another* weight row's
 * name — checking backward first avoids that ambiguity entirely, because
 * `result`'s last entry is only still a bare name if nothing has merged
 * into it yet. Falls back to the following line when there's no usable
 * preceding one (e.g. the weight row is the very first line). A weight row
 * with no usable name neighbor either way is left as-is.
 */
export function mergeWeightRows(lines: string[]): string[] {
	const result: string[] = [];
	let skipNext = false;

	for (let i = 0; i < lines.length; i++) {
		if (skipNext) {
			skipNext = false;
			continue;
		}

		const match = lines[i].match(WEIGHT_ROW);
		if (!match) {
			result.push(lines[i]);
			continue;
		}

		const total = match[1];
		const previous = result[result.length - 1];

		if (previous !== undefined && isPlainNameLine(previous)) {
			result[result.length - 1] = `${previous.trim()} ${total}`;
			continue;
		}

		if (i + 1 < lines.length && isPlainNameLine(lines[i + 1])) {
			result.push(`${lines[i + 1].trim()} ${total}`);
			skipNext = true;
			continue;
		}

		result.push(lines[i]);
	}

	return result;
}
