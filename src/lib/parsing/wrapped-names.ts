import { parsePriceCents } from './price';
import { extractNameAndPrice } from './parse-line';

// A wrap that splits mid-word (e.g. "Hamburger - 200 gr - Sals" / "a BBQ
// 10,00% 8,00") leaves the price line's own name non-empty — just the tail
// of the broken word, e.g. "a BBQ" — rather than the fully-empty case above.
// Real item names are printed capitalized; a lowercase-starting, short own
// name after a priceless line is that broken-word tail, not a fresh item,
// so it's joined onto the pending buffer with no space (reassembling the
// word) instead of being discarded. The length cap keeps this from
// misfiring on a real (if unusually lowercase) multi-word item name.
const LOOKS_LIKE_WORD_TAIL = /^[a-zà-ÿ]/;
const WORD_TAIL_MAX_LENGTH = 12;

/**
 * Some receipts wrap a long item name across multiple OCR lines before its
 * price (e.g. "Rombo Yakitori alla \"Mugn" / "aia\"" / "10,00% 50,00"),
 * leaving the price line nameless once its VAT% is stripped. Buffers
 * consecutive priceless lines and, when a priced line's own name would be
 * empty, joins them onto it as a prefix. A priced line that already has a
 * name (e.g. a stray column header) discards the buffer instead — unless
 * that name looks like a broken word's tail (see above), in which case it's
 * still joined, just without an inserted space.
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
		const looksLikeWordTail =
			pendingFragments.length > 0 &&
			ownName.length <= WORD_TAIL_MAX_LENGTH &&
			LOOKS_LIKE_WORD_TAIL.test(ownName);

		if (ownName === '' && pendingFragments.length > 0) {
			result.push([...pendingFragments, line.trim()].join(' '));
		} else if (looksLikeWordTail) {
			result.push(pendingFragments.join(' ') + line.trim());
		} else {
			result.push(line);
		}
		pendingFragments = [];
	}

	return result;
}
