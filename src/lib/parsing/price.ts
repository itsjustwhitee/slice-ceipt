// OCR sometimes misreads a "-" as a dash or smart quote. "-" must stay
// first in this string or it becomes a range operator inside `[...]`.
const NEGATIVE_SIGN_CHARS = '-‐‑‒–—−‘’“”';
const NEGATIVE_SIGN = new RegExp(`^[${NEGATIVE_SIGN_CHARS}]$`);

// Colon is a fallback decimal separator (comma/dot misread as ":"), tried
// only when comma/dot parsing fails, to avoid misreading a timestamp.
const PRIMARY_SEPARATORS = [',', '.'];
const FALLBACK_SEPARATORS = [':'];

// Shared with parse-line.ts so name-stripping agrees with parsePriceCents
// on how many trailing chars count as "the price". Tolerates trailing
// non-digit junk (OCR noise), one short tax-code token (e.g. "T1"), or a
// single bare digit (a one-letter VAT-category code, e.g. "B", sometimes
// misread as a digit like "8") — never a real second price, which always
// has more than one digit or a decimal separator and so still falls
// through correctly.
export const TRAILING_AMOUNT = new RegExp(
	`([${NEGATIVE_SIGN_CHARS}]?)(\\d[\\d.,:]*\\d|\\d)\\s*(?:€|EUR)?\\s*(?:[A-Za-z]{1,3}\\d{0,2}|\\d)?[^\\d]*$`
);

// OCR sometimes inserts a space right after the decimal separator (e.g.
// "18, 00" instead of "18,00"), breaking the digit run apart.
export function normalizeSpacedDecimals(line: string): string {
	return line.replace(/([.,:])\s+(\d)/g, '$1$2');
}

function splitOnDecimalSeparator(
	numeric: string,
	separators: string[]
): { integerPart: string; decimalPart: string } | null {
	let decimalIndex = -1;
	for (const separator of separators) {
		decimalIndex = Math.max(decimalIndex, numeric.lastIndexOf(separator));
	}
	if (decimalIndex === -1) return null;

	const decimalPart = numeric.slice(decimalIndex + 1);
	if (decimalPart.length !== 2) return null;

	const integerPart = numeric.slice(0, decimalIndex).replace(/[.,:]/g, '');
	if (integerPart === '' || !/^\d+$/.test(integerPart)) return null;

	return { integerPart, decimalPart };
}

/**
 * Parses a trailing money amount, e.g. "PANE 2,50" -> 250,
 * "MILK 3.99" -> 399. Handles comma or dot decimals by treating whichever
 * separator appears last (with exactly 2 trailing digits) as decimal.
 * Returns null if no trailing amount is found.
 */
export function parsePriceCents(line: string): number | null {
	const match = normalizeSpacedDecimals(line).match(TRAILING_AMOUNT);
	if (!match) return null;
	const sign = NEGATIVE_SIGN.test(match[1]) ? -1 : 1;
	const numeric = match[2];

	const parsed =
		splitOnDecimalSeparator(numeric, PRIMARY_SEPARATORS) ??
		(/[a-zA-Z]/.test(line) ? splitOnDecimalSeparator(numeric, FALLBACK_SEPARATORS) : null);
	if (!parsed) return null;

	return sign * (Number(parsed.integerPart) * 100 + Number(parsed.decimalPart));
}
