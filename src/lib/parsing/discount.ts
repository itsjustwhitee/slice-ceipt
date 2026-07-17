import type { ParsedLine } from './parse-line';

export interface ParsedItem {
	name: string;
	unitPriceCents: number;
	quantity: number;
	originalPriceCents?: number;
	isWholeReceiptDiscount?: boolean;
}

// Discount lines with one of these words in their name are loyalty-card /
// spend-threshold style discounts that apply to the whole purchase, not to
// one specific item — even when they happen to immediately follow an item
// line. Everything else negative is treated as a per-item discount merged
// into the line before it.
const WHOLE_RECEIPT_DISCOUNT_KEYWORDS = /FEDELT|CARTA|PUNTI|BUONO|PROMOZ|LOYALTY/i;

/**
 * Walks the parsed lines in order, merging per-item discounts into the item
 * they apply to and turning whole-receipt discounts into their own
 * synthetic item (negative price, not tied to any specific item).
 */
export function applyDiscounts(lines: ParsedLine[]): ParsedItem[] {
	const result: ParsedItem[] = [];

	for (const line of lines) {
		if (line.unitPriceCents >= 0) {
			result.push({ name: line.name, unitPriceCents: line.unitPriceCents, quantity: line.quantity });
			continue;
		}

		const previous = result[result.length - 1];
		const isWholeReceipt =
			WHOLE_RECEIPT_DISCOUNT_KEYWORDS.test(line.name) ||
			!previous ||
			previous.unitPriceCents <= 0 ||
			previous.originalPriceCents !== undefined;

		if (!isWholeReceipt) {
			previous.originalPriceCents = previous.unitPriceCents;
			previous.unitPriceCents = previous.unitPriceCents + line.unitPriceCents;
			continue;
		}

		result.push({
			name: line.name,
			unitPriceCents: line.unitPriceCents,
			quantity: 1,
			isWholeReceiptDiscount: true
		});
	}

	return result;
}
