import { extractItemLines, trimFooter, normalizeRunningTotalLines } from './lines';
import { mergeWeightRows } from './weight-lines';
import { mergeWrappedNameLines } from './wrapped-names';
import { mergeBareQuantityLines } from './quantity-lines';
import { extractNameAndPrice } from './parse-line';
import { applyDiscounts, type ParsedItem } from './discount';
import { groupIdenticalItems } from './group';

export type { ParsedItem } from './discount';

/**
 * Turns raw OCR/text-layer output for a receipt into a best-effort list of
 * items: normalizes a running-total (SUBTOTALE) line so it survives even if
 * OCR mangled its own printed amount, merges bare "weight / price-per-kg /
 * total" rows into their nameless neighbor, trims the footer, merges an
 * item name wrapped across multiple OCR lines back onto its price line,
 * merges standalone "N x price" quantity lines into their adjacent item
 * line, extracts name/price/quantity per line, merges per-item discounts
 * and separates whole-receipt discounts, groups identical repeated lines
 * into one item with a summed quantity, and finally drops any line that
 * still has no name — an OCR artifact garbled enough to produce a bare
 * unlabeled number (e.g. a quantity marker's "x" dropped, merging "2 x
 * 9,50" into "29,50") is never a real item, and surfacing it as one would
 * silently inflate the total rather than just under-counting by the one
 * unrecovered line. This is intentionally best-effort — store formats vary
 * too much to guarantee a perfect parse; the UI's manual-correction tools
 * are the safety net for whatever this misses.
 *
 * `mergeWeightRows` and `normalizeRunningTotalLines` run first, on the
 * fully raw lines, and `mergeWrappedNameLines` right after `trimFooter`
 * (before `extractItemLines`'s own trailing-price filter) — all three
 * either merge a priceless line into an adjacent one or need a line to
 * survive despite having no genuinely parseable price, so all need to run
 * before that filter would otherwise drop them.
 */
export function parseReceiptText(rawText: string): ParsedItem[] {
	const lines = normalizeRunningTotalLines(mergeWeightRows(rawText.split('\n')));
	const nameFixedLines = mergeWrappedNameLines(trimFooter(lines));
	const itemLines = mergeBareQuantityLines(extractItemLines(nameFixedLines));
	const parsedLines = itemLines
		.map(extractNameAndPrice)
		.filter((line): line is NonNullable<typeof line> => line !== null);
	const withDiscounts = applyDiscounts(parsedLines);
	return groupIdenticalItems(withDiscounts).filter((item) => item.name.trim() !== '');
}
