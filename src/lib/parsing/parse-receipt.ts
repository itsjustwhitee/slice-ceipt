import { extractItemLines, trimFooter, normalizeRunningTotalLines } from './lines';
import { mergeWeightRows } from './weight-lines';
import { mergeWrappedNameLines } from './wrapped-names';
import { mergeBareQuantityLines } from './quantity-lines';
import { extractNameAndPrice } from './parse-line';
import { applyDiscounts, type ParsedItem } from './discount';
import { groupIdenticalItems } from './group';

export type { ParsedItem } from './discount';

/**
 * Turns raw OCR/text-layer output into a best-effort item list: normalizes
 * the running-total line, merges weight rows/wrapped names/bare-quantity
 * lines into their item line, extracts name/price/quantity, merges
 * discounts, groups duplicates, and drops any still-nameless line (an
 * unrecoverable OCR artifact, not a real item). Store formats vary too
 * much to guarantee a perfect parse — manual correction is the safety net.
 */
export function parseReceiptText(rawText: string): ParsedItem[] {
	const lines = normalizeRunningTotalLines(mergeWeightRows(rawText.split('\n')));
	const nameFixedLines = mergeWrappedNameLines(trimFooter(lines));
	const itemLines = mergeBareQuantityLines(extractItemLines(nameFixedLines));
	const parsedLines = itemLines
		.map(extractNameAndPrice)
		.filter((line): line is NonNullable<typeof line> => line !== null);
	const withDiscounts = applyDiscounts(parsedLines);
	// A real item name always has at least one letter — a name that's
	// empty or pure punctuation/digits (e.g. "|") is a leftover OCR
	// artifact, not a product, and would otherwise show up as a phantom
	// item inflating the total.
	return groupIdenticalItems(withDiscounts).filter((item) => /\p{L}/u.test(item.name));
}
