import { parsePriceCents } from './price';
import { extractNameAndPrice } from './parse-line';

/**
 * Some receipts wrap a long item name across multiple OCR lines before its
 * price (e.g. "Rombo Yakitori alla \"Mugn" / "aia\"" / "10,00% 50,00"),
 * leaving the price line nameless once its VAT% is stripped. Buffers
 * consecutive priceless lines and, when a priced line's own name would be
 * empty, joins them onto it as a prefix. A priced line that already has a
 * name (e.g. a stray column header) discards the buffer instead.
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
