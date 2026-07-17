/**
 * Parses a trailing money amount from the end of a line, e.g. "PANE 2,50"
 * -> 250, "TOTALE EURO 1.234,56" -> 123456, "MILK 3.99" -> 399,
 * "SCONTO -0,50" -> -50. Handles both European (comma decimal) and US
 * (dot decimal) formats by treating whichever separator appears last AND
 * is followed by exactly 2 digits as the decimal separator — this works
 * without knowing the locale in advance. Returns null if no trailing
 * amount is found (e.g. a bare quantity code, a percentage, or a line
 * with no price at all).
 */
export function parsePriceCents(line: string): number | null {
	const match = line.match(/(-?)(\d[\d.,]*\d|\d)\s*(?:€|EUR)?\s*$/);
	if (!match) return null;
	const sign = match[1] === '-' ? -1 : 1;
	const numeric = match[2];

	const lastComma = numeric.lastIndexOf(',');
	const lastDot = numeric.lastIndexOf('.');
	const decimalIndex = Math.max(lastComma, lastDot);
	if (decimalIndex === -1) return null;

	const decimalPart = numeric.slice(decimalIndex + 1);
	if (decimalPart.length !== 2) return null;

	const integerPart = numeric.slice(0, decimalIndex).replace(/[.,]/g, '');
	if (integerPart === '' || !/^\d+$/.test(integerPart)) return null;

	return sign * (Number(integerPart) * 100 + Number(decimalPart));
}
