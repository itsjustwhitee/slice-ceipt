import { splitAmongWeights, type WeightedParticipant } from './split';

export interface GroupUnit {
	amountCents: number;
	assignment: Map<string, number>;
}

export interface GroupSplitResult {
	totals: Map<string, number>;
	unassignedUnitIndices: number[];
	unassignedTotalCents: number;
}

/**
 * Computes each participant's total across every unit, plus which units
 * have no assignment yet ("non assegnato"). `participantOrder` is the
 * canonical, deterministic order used both to guarantee every participant
 * appears in `totals` (even at 0) and to break largest-remainder ties
 * consistently across units — it must NOT be derived from a `Map`'s
 * iteration order, which follows insertion order and can vary per unit.
 */
export function calculateGroupSplit(
	units: GroupUnit[],
	participantOrder: string[]
): GroupSplitResult {
	const totals = new Map<string, number>(participantOrder.map((id) => [id, 0]));
	const unassignedUnitIndices: number[] = [];
	let unassignedTotalCents = 0;

	units.forEach((unit, index) => {
		if (unit.assignment.size === 0) {
			unassignedUnitIndices.push(index);
			unassignedTotalCents += unit.amountCents;
			return;
		}
		const participants: WeightedParticipant[] = participantOrder
			.filter((id) => unit.assignment.has(id))
			.map((id) => ({ participantId: id, weight: unit.assignment.get(id)! }));
		const shares = splitAmongWeights(unit.amountCents, participants);
		for (const [participantId, cents] of shares) {
			totals.set(participantId, (totals.get(participantId) ?? 0) + cents);
		}
	});

	return { totals, unassignedUnitIndices, unassignedTotalCents };
}
