import type { ParsedLine } from './parse-line';
import { RUNNING_TOTAL_KEYWORDS } from './lines';

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

// A discount right after a running-total line (e.g. SUBTOTALE) is
// whole-receipt too, even if its wording matches no keyword above.

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
			// The discount line's amount is a lump sum for the whole line, not
			// per unit (real Lidl receipt: "COSTINE DI SUINO ... 8,38" / "Cad
			// 4,19 Pz. 2" / "Coupon Lidl Plus -5% ... -0,42" — the -0.42 is 5%
			// of the 8.38 *total*, not per piece). Adding it straight to
			// unitPriceCents like a per-unit amount would multiply it by
			// quantity when the split is computed downstream, over-discounting
			// a multi-unit item. Spread it across the quantity instead.
			previous.unitPriceCents = Math.round(
				(previous.unitPriceCents * previous.quantity + line.unitPriceCents) / previous.quantity
			);
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
