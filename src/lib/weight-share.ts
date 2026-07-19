/**
 * Rounded display percentage per participant, purely for the group
 * custom-share panel's live feedback label — the actual split still runs
 * through `splitAmongWeights`'s exact BigInt math; this is not used for
 * any money calculation.
 */
export function weightPercentages(weights: Map<string, number>): Map<string, number> {
	const total = [...weights.values()].reduce((sum, w) => sum + w, 0);
	const result = new Map<string, number>();
	if (total <= 0) return result;
	for (const [id, weight] of weights) {
		result.set(id, Math.round((weight / total) * 100));
	}
	return result;
}
