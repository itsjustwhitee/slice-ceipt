import { parsePriceCents } from './price';

export interface ParsedLine {
	name: string;
	unitPriceCents: number;
	quantity: number;
}

const TRAILING_PRICE = /(-?)(\d[\d.,]*\d|\d)\s*(?:€|EUR)?\s*$/;

// Matches an explicit quantity marker. The digit comes BEFORE the marker
// word for "X"/"PZ" style ("3X", "3 X", "3 PZ") but AFTER it for "Q.TA"
// style ("Q.TA 2", "Q.TÀ 3") — these are genuinely different conventions,
// not two orderings of the same one, so they need separate alternatives
// rather than one "digit-then-word" pattern.
const QUANTITY_MARKER =
	/(?:(\d+)\s*(?:X\b|PZ\b)|\bX\s*(\d+)\b|Q\.?T[AÀ]?\.?\s*(\d+))/i;

// Many Italian receipts print a per-line VAT rate between the item name and
// its price (e.g. "PASSATA DI POMODORO 4,00% 0,99") — this is the item's tax
// category, not part of its name, and must be stripped before the name is
// used, the same way a quantity marker is.
const VAT_PERCENTAGE = /\d{1,2}[.,]\d{2}\s*%\s*$/;

/**
 * Splits one already-confirmed item line (from `extractItemLines`) into its
 * name, per-unit price, and quantity. When the line's price is a lump total
 * for an explicit quantity marker (e.g. "3X BIRRA ICHNUSA 4,50" — see
 * idea.md's worked example, where 3 units at €4.50 total means €1.50 each),
 * the marker is stripped from the name and the price is divided by the
 * quantity (rounded) to get the per-unit price. `quantity` defaults to 1
 * when no marker is present, and the price is used as-is.
 */
export function extractNameAndPrice(line: string): ParsedLine | null {
	const totalCents = parsePriceCents(line);
	if (totalCents === null) return null;

	const priceMatch = line.match(TRAILING_PRICE);
	const nameWithVat = line.slice(0, line.length - (priceMatch?.[0].length ?? 0)).trim();
	const nameWithMarker = nameWithVat.replace(VAT_PERCENTAGE, '').trim();

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
