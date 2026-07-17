import { calculateGroupSplit, type GroupSplitResult, type GroupUnit } from '$lib/money';
import type { ParsedItem } from '$lib/parsing';

export interface GroupUnitState {
	assignment: Map<string, number>;
}

export interface GroupItem {
	id: string;
	name: string;
	unitPriceCents: number;
	quantity: number;
	originalPriceCents?: number;
	isWholeReceiptDiscount?: boolean;
	units: GroupUnitState[];
}

/**
 * Builds session items from the parser's output, decomposing each into one
 * `GroupUnitState` per unit of quantity (per spec §5: every Item is always
 * decomposed into individual Units). Plain items start unassigned (empty
 * `assignment` map) — the UI must flag these until the user acts. A
 * whole-receipt-discount pseudo-item defaults to being pre-split equally
 * across every current participant (weight 1 each), per spec §3.4/§4.3,
 * since it applies to the whole purchase rather than needing per-item
 * judgment.
 */
export function createGroupItemsFromParsed(
	parsedItems: ParsedItem[],
	participantIds: string[]
): GroupItem[] {
	return parsedItems.map((parsed, index) => ({
		id: `item-${index}`,
		name: parsed.name,
		unitPriceCents: parsed.unitPriceCents,
		quantity: parsed.quantity,
		originalPriceCents: parsed.originalPriceCents,
		isWholeReceiptDiscount: parsed.isWholeReceiptDiscount,
		units: Array.from({ length: parsed.quantity }, () => ({
			assignment: parsed.isWholeReceiptDiscount
				? new Map(participantIds.map((id) => [id, 1]))
				: new Map()
		}))
	}));
}

/**
 * Flattens every item's units into `$lib/money`'s flat unit list and
 * delegates to `calculateGroupSplit` — this file never reimplements any
 * money math, it only bridges session state to the already-tested engine.
 */
export function computeGroupTotals(
	items: GroupItem[],
	participantOrder: string[]
): GroupSplitResult {
	const units: GroupUnit[] = items.flatMap((item) =>
		item.units.map((unit) => ({ amountCents: item.unitPriceCents, assignment: unit.assignment }))
	);
	return calculateGroupSplit(units, participantOrder);
}
