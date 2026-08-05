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

// A running/partial total printed mid-receipt (e.g. "SUBTOTALE 32,00")
// rather than a real item — `lines.ts` deliberately lets it through instead
// of cutting the item region off there (see its comment on
// `FOOTER_KEYWORDS`), so it still needs to be recognized and dropped here.
// Its real purpose for this module is positional: a discount line
// immediately after one of these is a whole-receipt discount (e.g. "20% off
// the subtotal") even when its wording doesn't match
// `WHOLE_RECEIPT_DISCOUNT_KEYWORDS` and the item before it doesn't look
// like an obvious discount target — see `afterRunningTotal` below.
const RUNNING_TOTAL_KEYWORDS = /^(SUBTOTALE|SUBTOTAL)\b/i;

/**
 * Walks the parsed lines in order, merging per-item discounts into the item
 * they apply to and turning whole-receipt discounts into their own
 * synthetic item (negative price, not tied to any specific item).
 */
export function applyDiscounts(lines: ParsedLine[]): ParsedItem[] {
	const result: ParsedItem[] = [];
	let afterRunningTotal = false;

	for (const line of lines) {
		if (RUNNING_TOTAL_KEYWORDS.test(line.name)) {
			afterRunningTotal = true;
			continue;
		}

		if (line.unitPriceCents >= 0) {
			result.push({ name: line.name, unitPriceCents: line.unitPriceCents, quantity: line.quantity });
			afterRunningTotal = false;
			continue;
		}

		const previous = result[result.length - 1];
		const isWholeReceipt =
			afterRunningTotal ||
			WHOLE_RECEIPT_DISCOUNT_KEYWORDS.test(line.name) ||
			!previous ||
			previous.unitPriceCents <= 0 ||
			previous.originalPriceCents !== undefined;
		afterRunningTotal = false;

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
