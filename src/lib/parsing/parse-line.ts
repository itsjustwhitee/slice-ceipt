import { parsePriceCents, normalizeSpacedDecimals, TRAILING_AMOUNT as TRAILING_PRICE } from './price';

export interface ParsedLine {
	name: string;
	unitPriceCents: number;
	quantity: number;
}

// Matches an explicit quantity marker: digit-before-word for "X"/"PZ"
// style ("3X", "3 PZ"), digit-after for "Q.TA" style ("Q.TA 2"). No
// digit-AFTER-"X" form ("X8") on purpose — real receipt evidence
// (Coop: "DANACOL BIANCO X8" priced as one €5.90 pack) shows that shape
// is often a product/pack-size code, not a checkout quantity marker.
// "PZ" additionally requires a space before it ("3 PZ", never "3PZ") —
// unlike "X", a glued-on "<N>PZ" is a pack-size suffix baked into the
// product code (real Coop receipt: "M-ASC.COOP CASA 3PZ" priced as one
// €1.85 pack of 3, not 3 units at ~0.62 each), while a real quantity
// marker is always printed with a space.
const QUANTITY_MARKER = /(?:(\d+)\s*X\b|(\d+)\s+PZ\b|Q\.?T[AÀ]?\.?\s*(\d+))/i;

// Many Italian receipts print a per-line VAT rate between the item name and
// its price (e.g. "PASSATA DI POMODORO 4,00% 0,99") — this is the item's tax
// category, not part of its name, and must be stripped before the name is
// used, the same way a quantity marker is. Some real receipts' extracted
// text puts a space after the decimal separator ("4, 00%" rather than
// "4,00%") — allow optional whitespace there too, or the rate is left
// stuck to the name instead of being stripped.
const VAT_PERCENTAGE = /\d{1,2}\s*[.,]\s*\d{2}\s*%\s*$/;

/**
 * Splits one already-confirmed item line (from `extractItemLines`) into its
 * name, per-unit price, and quantity. When the line's price is a lump total
 * for an explicit quantity marker (e.g. "3X BIRRA ICHNUSA 4,50" — see
 * idea.md's worked example, where 3 units at €4.50 total means €1.50 each),
 * the marker is stripped from the name and the price is divided by the
 * quantity (rounded) to get the per-unit price. `quantity` defaults to 1
 * when no marker is present, and the price is used as-is.
 */
export function extractNameAndPrice(rawLine: string): ParsedLine | null {
	const totalCents = parsePriceCents(rawLine);
	if (totalCents === null) return null;

	// Normalized the same way parsePriceCents normalizes internally, so the
	// match here lines up with the price it just computed above.
	const line = normalizeSpacedDecimals(rawLine);
	const priceMatch = line.match(TRAILING_PRICE);
	const nameWithVat = line.slice(0, line.length - (priceMatch?.[0].length ?? 0)).trim();
	const nameWithMarker = nameWithVat.replace(VAT_PERCENTAGE, '').replace(/\s+/g, ' ').trim();

	const markerMatch = nameWithMarker.match(QUANTITY_MARKER);
	if (!markerMatch) {
		return { name: nameWithMarker, unitPriceCents: totalCents, quantity: 1 };
	}

	const quantity = Number(markerMatch[1] ?? markerMatch[2] ?? markerMatch[3]);
	const cleanName = (
		nameWithMarker.slice(0, markerMatch.index) +
		nameWithMarker.slice((markerMatch.index ?? 0) + markerMatch[0].length)
	)
		.replace(/\s+/g, ' ')
		.trim();

	return {
		name: cleanName || nameWithMarker,
		unitPriceCents: Math.round(totalCents / quantity),
		quantity
	};
}
