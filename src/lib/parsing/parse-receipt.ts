import { extractItemLines, trimFooter } from './lines';
import { mergeWeightRows } from './weight-lines';
import { mergeWrappedNameLines } from './wrapped-names';
import { mergeBareQuantityLines } from './quantity-lines';
import { extractNameAndPrice } from './parse-line';
import { applyDiscounts, type ParsedItem } from './discount';
import { groupIdenticalItems } from './group';

export type { ParsedItem } from './discount';

/**
 * Turns raw OCR/text-layer output for a receipt into a best-effort list of
 * items: merges bare "weight / price-per-kg / total" rows into their
 * nameless neighbor, trims the footer, merges an item name wrapped across
 * multiple OCR lines back onto its price line, merges standalone
 * "N x price" quantity lines into their adjacent item line, extracts
 * name/price/quantity per line, merges per-item discounts and separates
 * whole-receipt discounts, then groups identical repeated lines into one
 * item with a summed quantity. This is intentionally best-effort — store
 * formats vary too much to guarantee a perfect parse; the UI's
 * manual-correction tools are the safety net for whatever this misses.
 *
 * `mergeWeightRows` runs first, on the fully raw lines, and
 * `mergeWrappedNameLines` right after `trimFooter` (before
 * `extractItemLines`'s own trailing-price filter) — both merge a priceless
 * line into an adjacent one, so both need to run before that filter would
 * otherwise drop the priceless side of the merge.
 */
export function parseReceiptText(rawText: string): ParsedItem[] {
	const lines = mergeWeightRows(rawText.split('\n'));
	const nameFixedLines = mergeWrappedNameLines(trimFooter(lines));
	const itemLines = mergeBareQuantityLines(extractItemLines(nameFixedLines));
	const parsedLines = itemLines
		.map(extractNameAndPrice)
		.filter((line): line is NonNullable<typeof line> => line !== null);
	const withDiscounts = applyDiscounts(parsedLines);
	return groupIdenticalItems(withDiscounts);
}
