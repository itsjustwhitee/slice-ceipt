import { calculateSingleShare, calculateSingleSplit, type Fraction } from '$lib/money';
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

/**
 * The full receipt total, independent of any fraction — every unit's
 * price counted once, regardless of whether (or how much of) it's the
 * user's. Used to show "the rest of the bill" (what isn't yours) in
 * single mode's pinned bar, mirroring group mode's unassigned total.
 */
export function computeSingleGrandTotal(items: SingleItem[]): number {
	return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export interface ItemShare {
	name: string;
	shareCents: number;
}

/**
 * Per-item breakdown of the user's own share in single mode, computed via
 * the same `calculateSingleShare` `computeSingleTotal` already uses per
 * unit, so summing every returned `shareCents` reproduces the running
 * total exactly. Items with every unit set to "non mio" are omitted.
 */
export function computeSingleItemization(items: SingleItem[]): ItemShare[] {
	const result: ItemShare[] = [];
	for (const item of items) {
		let shareCents = 0;
		let included = false;
		for (const unit of item.units) {
			if (unit.fraction === null) continue;
			included = true;
			shareCents += calculateSingleShare(item.unitPriceCents, unit.fraction);
		}
		if (included) result.push({ name: item.name, shareCents });
	}
	return result;
}
