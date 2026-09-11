import type { ParsedItem } from './discount';

/**
 * Collapses consecutive items with the same name and unit price into one
 * entry with summed quantity — handles POS systems that print one line per
 * identical unit (e.g. three separate "BIRRA ICHNUSA 1,50" lines) rather
 * than a single line with a quantity marker. A discounted item is grouped
 * with a neighbor too, but only when the discount matches exactly (same
 * `originalPriceCents`) — merging discounts that differ would silently lose
 * one of them. A whole-receipt discount pseudo-item is always left
 * standalone: each represents its own discount event, not a repeated unit.
 */
export function groupIdenticalItems(items: ParsedItem[]): ParsedItem[] {
	const result: ParsedItem[] = [];

	for (const item of items) {
		const previous = result[result.length - 1];

		if (
			!item.isWholeReceiptDiscount &&
			previous &&
			!previous.isWholeReceiptDiscount &&
			previous.name === item.name &&
			previous.unitPriceCents === item.unitPriceCents &&
			previous.originalPriceCents === item.originalPriceCents
		) {
			previous.quantity += item.quantity;
			continue;
		}

		result.push({ ...item });
	}

	return result;
}
