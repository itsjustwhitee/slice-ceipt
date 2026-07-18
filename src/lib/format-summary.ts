import { formatCents } from '$lib/money';

export interface PersonSummary {
	name: string;
	totalCents: number;
	items: { name: string; shareCents: number }[];
}

/** Builds the group-mode "Copia"/share text: one block per participant, name + total, then an indented per-item breakdown. */
export function formatGroupSummaryText(
	people: PersonSummary[],
	currency: string,
	locale: string
): string {
	return people
		.map((p) => {
			const lines = [`${p.name}: ${formatCents(p.totalCents, currency, locale)}`];
			for (const item of p.items) {
				lines.push(`  ${item.name}: ${formatCents(item.shareCents, currency, locale)}`);
			}
			return lines.join('\n');
		})
		.join('\n\n');
}

/** Builds the single-mode "Copia"/share text: the running total, then an indented per-item breakdown. */
export function formatSingleSummaryText(
	totalCents: number,
	items: { name: string; shareCents: number }[],
	currency: string,
	locale: string
): string {
	const lines = [formatCents(totalCents, currency, locale)];
	for (const item of items) {
		lines.push(`  ${item.name}: ${formatCents(item.shareCents, currency, locale)}`);
	}
	return lines.join('\n');
}
