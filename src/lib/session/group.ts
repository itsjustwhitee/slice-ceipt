import { calculateGroupSplit, splitAmongWeights, type GroupSplitResult, type GroupUnit, type WeightedParticipant } from '$lib/money';
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

export interface ItemShare {
	name: string;
	shareCents: number;
}

/**
 * Per-item breakdown of one participant's share, computed the same way
 * `calculateGroupSplit` computes totals (same per-unit `splitAmongWeights`
 * call, same `participantOrder` for tie-breaking) so summing every
 * returned `shareCents` reproduces that participant's total exactly —
 * this never reimplements the split math, only itemizes it per item.
 */
export function computeGroupItemization(
	items: GroupItem[],
	participantId: string,
	participantOrder: string[]
): ItemShare[] {
	const result: ItemShare[] = [];
	for (const item of items) {
		let shareCents = 0;
		let included = false;
		for (const unit of item.units) {
			if (!unit.assignment.has(participantId)) continue;
			included = true;
			const weighted: WeightedParticipant[] = participantOrder
				.filter((id) => unit.assignment.has(id))
				.map((id) => ({ participantId: id, weight: unit.assignment.get(id)! }));
			const shares = splitAmongWeights(item.unitPriceCents, weighted);
			shareCents += shares.get(participantId) ?? 0;
		}
		if (included) result.push({ name: item.name, shareCents });
	}
	return result;
}

/**
 * Sums each participant's weight across every unit of an item — used by the
 * item list to decide a row's color (flat for one participant, a
 * proportional gradient for two or more) without duplicating the
 * per-unit-weight-summing logic in the component itself.
 */
export function aggregateItemAssignment(units: { assignment: Map<string, number> }[]): Map<string, number> {
	const totals = new Map<string, number>();
	for (const unit of units) {
		for (const [participantId, weight] of unit.assignment) {
			totals.set(participantId, (totals.get(participantId) ?? 0) + weight);
		}
	}
	return totals;
}
