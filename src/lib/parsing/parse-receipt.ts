import { extractItemLines } from './lines';
import { extractNameAndPrice } from './parse-line';
import { applyDiscounts, type ParsedItem } from './discount';
import { groupIdenticalItems } from './group';

export type { ParsedItem } from './discount';

/**
 * Turns raw OCR/text-layer output for a receipt into a best-effort list of
 * items: trims the header/footer, extracts name/price/quantity per line,
 * merges per-item discounts and separates whole-receipt discounts, then
 * groups identical repeated lines into one item with a summed quantity.
 * This is intentionally best-effort — store formats vary too much to
 * guarantee a perfect parse; the UI's manual-correction tools are the
 * safety net for whatever this misses.
 */
export function parseReceiptText(rawText: string): ParsedItem[] {
	const lines = rawText.split('\n');
	const itemLines = extractItemLines(lines);
	const parsedLines = itemLines
		.map(extractNameAndPrice)
		.filter((line): line is NonNullable<typeof line> => line !== null);
	const withDiscounts = applyDiscounts(parsedLines);
	return groupIdenticalItems(withDiscounts);
}
