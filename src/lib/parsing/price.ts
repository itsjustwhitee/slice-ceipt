// A few punctuation marks that real OCR output has been observed to
// substitute for a plain "-" minus sign on a receipt (tested against this
// project's actual Tesseract pipeline on real photos: a printed "-6,40"
// came back as "“6,40", U+201C LEFT DOUBLE QUOTATION MARK) — dashes and
// smart quotes are visually close enough to a short printed hyphen for
// Tesseract to occasionally confuse them. Accepted as a negative sign
// alongside "-" itself; a plain "-" is by far the common case. The ASCII
// "-" is listed first, before any other "-"-like character, specifically
// so it can never end up between two other characters in the `[...]`
// classes built from this string below — that position is the one place
// "-" stops being literal and starts meaning "range" in a regex character
// class, which would silently make this list mean something else.
const NEGATIVE_SIGN_CHARS = '-‐‑‒–—−‘’“”';
const NEGATIVE_SIGN = new RegExp(`^[${NEGATIVE_SIGN_CHARS}]$`);

// Decimal separator candidates, tried in this order. Colon is a fallback,
// not a peer of comma/dot: it's only tried when neither comma nor dot
// parsing succeeds, since a bare digit-colon-digit string is at least as
// likely to be a timestamp (e.g. a receipt's "21:08" printed time) as a
// misread price — see `parsePriceCents`'s doc comment.
const PRIMARY_SEPARATORS = [',', '.'];
const FALLBACK_SEPARATORS = [':'];

/**
 * Matches a trailing money amount (sign + digits/separators + optional
 * currency), shared with `parse-line.ts`'s name/price splitting so the
 * two stay in sync — that code needs to know exactly how many trailing
 * characters `parsePriceCents` below considered "the price" in order to
 * strip the right amount off the end of the line to get the item's name.
 *
 * Tolerates non-digit junk after the amount (`[^\d]*$` rather than a
 * plain `\s*$`) — a real receipt photographed on a reflective/patterned
 * surface (tested against this project's actual Tesseract pipeline: a
 * wood-grain table under flash glare) picks up stray noise characters
 * past the true end of almost every printed line, e.g. "20,00" coming
 * back as "20,00 INNS IN". Requiring that trailing run to be digit-free
 * still guarantees the matched amount is the LAST number on the line: any
 * later digit forces the match to fail here and fall back to whatever
 * (if anything) qualifies further right, exactly as before this
 * allowance existed.
 */
export const TRAILING_AMOUNT = new RegExp(`([${NEGATIVE_SIGN_CHARS}]?)(\\d[\\d.,:]*\\d|\\d)\\s*(?:€|EUR)?[^\\d]*$`);

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
 * Parses a trailing money amount from the end of a line, e.g. "PANE 2,50"
 * -> 250, "TOTALE EURO 1.234,56" -> 123456, "MILK 3.99" -> 399,
 * "SCONTO -0,50" -> -50. Handles both European (comma decimal) and US
 * (dot decimal) formats by treating whichever separator appears last AND
 * is followed by exactly 2 digits as the decimal separator — this works
 * without knowing the locale in advance. Returns null if no trailing
 * amount is found (e.g. a bare quantity code, a percentage, or a line
 * with no price at all).
 *
 * Also tolerant of two specific real-world OCR misreads (see the
 * `NEGATIVE_SIGN`/`FALLBACK_SEPARATORS` comments above): a minus sign
 * read back as a dash/smart-quote character, and — only when the line has
 * at least one letter, e.g. "SERVIZIO ACQUA 1:50" rather than a bare
 * "21:08" — a comma decimal separator read back as a colon.
 */
export function parsePriceCents(line: string): number | null {
	const match = line.match(TRAILING_AMOUNT);
	if (!match) return null;
	const sign = NEGATIVE_SIGN.test(match[1]) ? -1 : 1;
	const numeric = match[2];

	const parsed =
		splitOnDecimalSeparator(numeric, PRIMARY_SEPARATORS) ??
		(/[a-zA-Z]/.test(line) ? splitOnDecimalSeparator(numeric, FALLBACK_SEPARATORS) : null);
	if (!parsed) return null;

	return sign * (Number(parsed.integerPart) * 100 + Number(parsed.decimalPart));
}
