export interface WeightedParticipant {
	participantId: string;
	weight: number;
}

function floorDivBigInt(numerator: bigint, denominator: bigint): bigint {
	// Floors toward -Infinity (matches Math.floor semantics for the
	// equivalent real-number division), unlike BigInt's native truncating
	// division which rounds toward zero.
	const quotient = numerator / denominator;
	const remainder = numerator % denominator;
	if (remainder !== 0n && remainder < 0n !== denominator < 0n) {
		return quotient - 1n;
	}
	return quotient;
}

/**
 * Splits `amountCents` among `participants` proportionally to their weight,
 * using the largest-remainder method so the returned shares always sum to
 * exactly `amountCents` — no floating point is used anywhere in the
 * computation (BigInt only), so this holds exactly, not just to float
 * precision. Ties (equal remainders) are broken deterministically: the
 * participant earlier in the `participants` array wins.
 *
 * `amountCents` may be negative (e.g. a whole-receipt discount).
 * `weight` must be a positive integer for every participant.
 */
export function splitAmongWeights(
	amountCents: number,
	participants: WeightedParticipant[]
): Map<string, number> {
	if (participants.length === 0) {
		throw new Error('splitAmongWeights requires at least one participant');
	}
	for (const p of participants) {
		if (!Number.isInteger(p.weight) || p.weight <= 0) {
			throw new Error(
				`splitAmongWeights: weight for ${p.participantId} must be a positive integer`
			);
		}
	}

	const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
	const totalWeightBig = BigInt(totalWeight);
	const amountBig = BigInt(amountCents);

	const floors = participants.map((p) => {
		const numerator = amountBig * BigInt(p.weight);
		const floor = floorDivBigInt(numerator, totalWeightBig);
		// remainderNumerator represents (share - floor) * totalWeight, an
		// integer in [0, totalWeight) — comparing it directly across
		// participants (same totalWeight/denominator) is exact.
		const remainderNumerator = numerator - floor * totalWeightBig;
		return { participantId: p.participantId, floor: Number(floor), remainderNumerator };
	});

	const floorSum = floors.reduce((sum, f) => sum + f.floor, 0);
	const leftover = amountCents - floorSum;

	const order = floors
		.map((f, index) => ({ ...f, index }))
		.sort((a, b) => {
			if (a.remainderNumerator === b.remainderNumerator) return a.index - b.index;
			return a.remainderNumerator > b.remainderNumerator ? -1 : 1;
		});

	const result = new Map<string, number>();
	for (const f of floors) {
		result.set(f.participantId, f.floor);
	}
	for (let i = 0; i < leftover; i++) {
		const id = order[i].participantId;
		result.set(id, (result.get(id) ?? 0) + 1);
	}

	return result;
}
