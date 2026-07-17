import type { ParsedItem } from './discount';

/**
 * Collapses consecutive items with the same name and unit price into one
 * entry with summed quantity — handles POS systems that print one line per
 * identical unit (e.g. three separate "BIRRA ICHNUSA 1,50" lines) rather
 * than a single line with a quantity marker. Only plain items are grouped:
 * an item that already carries a discount (`originalPriceCents` set) or is
 * a whole-receipt discount pseudo-item is left standalone, since collapsing
 * those into a neighbor would silently lose the discount's identity.
 */
export function groupIdenticalItems(items: ParsedItem[]): ParsedItem[] {
	const result: ParsedItem[] = [];

	for (const item of items) {
		const isPlain = item.originalPriceCents === undefined && !item.isWholeReceiptDiscount;
		const previous = result[result.length - 1];
		const previousIsPlain =
			previous && previous.originalPriceCents === undefined && !previous.isWholeReceiptDiscount;

		if (
			isPlain &&
			previousIsPlain &&
			previous.name === item.name &&
			previous.unitPriceCents === item.unitPriceCents
		) {
			previous.quantity += item.quantity;
			continue;
		}

		result.push({ ...item });
	}

	return result;
}
