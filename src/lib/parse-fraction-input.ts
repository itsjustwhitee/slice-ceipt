import type { Fraction } from '$lib/money';

/**
 * Parses the single-mode custom-share field, which accepts either a
 * fraction ("2/5") or a percentage ("40%"), auto-detected by the presence
 * of `/` or `%` (per spec §4.2 — no separate format toggle). Returns `null`
 * for anything that doesn't parse as a valid positive share, which the
 * caller treats as "ignore this input" — distinct from the domain's own
 * `null` ("non mio"), which only ever comes from an explicit deselection.
 */
export function parseFractionInput(input: string): Fraction | null {
	const trimmed = input.trim();

	if (trimmed.endsWith('%')) {
		const percent = Number(trimmed.slice(0, -1).trim());
		if (!Number.isFinite(percent) || percent <= 0) return null;
		return { num: percent, den: 100 };
	}

	const slashIndex = trimmed.indexOf('/');
	if (slashIndex !== -1) {
		const num = Number(trimmed.slice(0, slashIndex).trim());
		const den = Number(trimmed.slice(slashIndex + 1).trim());
		if (!Number.isInteger(num) || !Number.isInteger(den) || num <= 0 || den <= 0) return null;
		return { num, den };
	}

	return null;
}
