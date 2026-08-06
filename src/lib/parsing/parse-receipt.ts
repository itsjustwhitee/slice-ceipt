import { extractItemLines } from './lines';
import { mergeWeightRows } from './weight-lines';
import { mergeBareQuantityLines } from './quantity-lines';
import { extractNameAndPrice } from './parse-line';
import { applyDiscounts, type ParsedItem } from './discount';
import { groupIdenticalItems } from './group';

export type { ParsedItem } from './discount';

/**
 * Turns raw OCR/text-layer output for a receipt into a best-effort list of
 * items: merges bare "weight / price-per-kg / total" rows into their
 * nameless neighbor, trims the header/footer, merges standalone
 * "N x price" quantity lines into their adjacent item line, extracts
 * name/price/quantity per line, merges per-item discounts and separates
 * whole-receipt discounts, then groups identical repeated lines into one
 * item with a summed quantity. This is intentionally best-effort — store
 * formats vary too much to guarantee a perfect parse; the UI's
 * manual-correction tools are the safety net for whatever this misses.
 *
 * `mergeWeightRows` runs first, on the fully raw lines, because the name
 * line it merges into has no price of its own and would otherwise be
 * dropped by `extractItemLines`'s trailing-price filter before ever
 * reaching it.
 */
export function parseReceiptText(rawText: string): ParsedItem[] {
	const lines = mergeWeightRows(rawText.split('\n'));
	const itemLines = mergeBareQuantityLines(extractItemLines(lines));
	const parsedLines = itemLines
		.map(extractNameAndPrice)
		.filter((line): line is NonNullable<typeof line> => line !== null);
	const withDiscounts = applyDiscounts(parsedLines);
	return groupIdenticalItems(withDiscounts);
}
