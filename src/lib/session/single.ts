import { calculateSingleSplit, type Fraction } from '$lib/money';
import type { ParsedItem } from '$lib/parsing';

export interface SingleUnitState {
	fraction: Fraction | null;
}

export interface SingleItem {
	id: string;
	name: string;
	unitPriceCents: number;
	quantity: number;
	originalPriceCents?: number;
	isWholeReceiptDiscount?: boolean;
	units: SingleUnitState[];
}

/**
 * Builds session items from the parser's output for single mode. Plain
 * items start as "non mio" (`fraction: null`) — the UI must flag these
 * until the user acts. A whole-receipt-discount pseudo-item defaults to
 * `1/participantCount`, mirroring group mode's "split across everyone"
 * default (per spec §3.4/§4.3).
 */
export function createSingleItemsFromParsed(
	parsedItems: ParsedItem[],
	participantCount: number
): SingleItem[] {
	return parsedItems.map((parsed, index) => ({
		id: `item-${index}`,
		name: parsed.name,
		unitPriceCents: parsed.unitPriceCents,
		quantity: parsed.quantity,
		originalPriceCents: parsed.originalPriceCents,
		isWholeReceiptDiscount: parsed.isWholeReceiptDiscount,
		units: Array.from({ length: parsed.quantity }, () => ({
			fraction: parsed.isWholeReceiptDiscount ? { num: 1, den: participantCount } : null
		}))
	}));
}

/**
 * Flattens every item's units into `$lib/money`'s flat unit list and
 * delegates to `calculateSingleSplit`.
 */
export function computeSingleTotal(items: SingleItem[]): number {
	const units = items.flatMap((item) =>
		item.units.map((unit) => ({ amountCents: item.unitPriceCents, fraction: unit.fraction }))
	);
	return calculateSingleSplit(units);
}
