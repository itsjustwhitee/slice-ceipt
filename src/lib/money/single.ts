export interface Fraction {
	num: number;
	den: number;
}

/**
 * The single-mode share of one unit: `amountCents` scaled by `fraction`,
 * rounded to the nearest cent. Returns 0 when `fraction` is `null` ("non
 * mio"). Unlike group-mode splitting, single mode has no reconciliation
 * requirement against other people's shares (they're never tracked), so a
 * plain rounded multiplication is sufficient here.
 */
export function calculateSingleShare(amountCents: number, fraction: Fraction | null): number {
	if (fraction === null) return 0;
	return Math.round((amountCents * fraction.num) / fraction.den);
}

/** Sums the single-mode share across every unit — the user's running total. */
export function calculateSingleSplit(
	units: { amountCents: number; fraction: Fraction | null }[]
): number {
	return units.reduce((sum, u) => sum + calculateSingleShare(u.amountCents, u.fraction), 0);
}
