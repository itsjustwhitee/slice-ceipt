import { parsePriceCents } from './price';
import { extractNameAndPrice } from './parse-line';

/**
 * Some receipts wrap a long item name across two (or more) OCR lines before
 * its price, e.g.:
 *
 *   Rombo Yakitori alla "Mugn
 *   aia"
 *                             10,00%          50,00
 *
 * Each name fragment has no price of its own, so `extractItemLines`'s
 * trailing-price filter drops both of them — and the price line, once its
 * VAT% is stripped, has nothing left to be its name, producing a nameless
 * €50 ghost item while the real name vanishes entirely.
 *
 * This walks the footer-trimmed (but not yet price-filtered — see
 * `trimFooter`) lines, buffering consecutive priceless, non-blank lines as
 * candidate name fragments. When a priced line is reached whose own parsed
 * name would be empty, the buffered fragments are joined onto it as a
 * prefix — recovering the name at the cost of a stray space wherever the
 * original word was actually broken mid-word (e.g. "Mugn aia" instead of
 * "Mugnaia"), which is a minor, easily hand-corrected cosmetic slip
 * compared to losing the item's name and having it silently show up
 * blank. A priced line that already has its own name discards any
 * buffered fragments instead (most commonly a column-header row like
 * "DESCRIZIONE IVA Prezzo(€)" that was never a wrapped name to begin
 * with) — they have no price either way, so `extractItemLines`'s filter
 * would have dropped them regardless.
 */
export function mergeWrappedNameLines(lines: string[]): string[] {
	const result: string[] = [];
	let pendingFragments: string[] = [];

	for (const line of lines) {
		if (line.trim() === '') continue;

		if (parsePriceCents(line) === null) {
			pendingFragments.push(line.trim());
			continue;
		}

		const ownName = extractNameAndPrice(line)?.name ?? '';
		if (ownName === '' && pendingFragments.length > 0) {
			result.push([...pendingFragments, line.trim()].join(' '));
		} else {
			result.push(line);
		}
		pendingFragments = [];
	}

	return result;
}
