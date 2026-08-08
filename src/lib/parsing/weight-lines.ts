import { parsePriceCents } from './price';

// A weighed item's row (bakeries, delis, pizza-by-weight) is three bare
// numbers — weight, price/kg, total — with the name on its own priceless
// line, e.g. "0.248  12.50  3.10" above/below "PIZZA MARGHERITA".
const WEIGHT_ROW =
	/^\s*\d+(?:[.,]\d+)?\s*(?:kg)?\s+\d+(?:[.,]\d+)?\s*(?:€|EUR)?(?:\s*\/\s*kg)?\s+(-?\d+[.,]\d{2})\s*(?:€|EUR)?\s*$/i;

function isPlainNameLine(line: string): boolean {
	const trimmed = line.trim();
	return trimmed !== '' && parsePriceCents(trimmed) === null && !WEIGHT_ROW.test(trimmed);
}

/**
 * Merges a weight row into the adjacent nameless-but-priceless name line
 * by appending the row's total to it (qty 1 — a weighed lot is one piece).
 * Must run before `extractItemLines`, since the name line has no price of
 * its own and would otherwise get filtered out first. Prefers merging
 * backward (into the line just pushed) over forward, since forward risks
 * grabbing a name already claimed by another weight row when several are
 * chained together.
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
