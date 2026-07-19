export interface WeightedShare {
	id: string;
	weight: number;
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Builds a CSS `linear-gradient` proportional to each share's weight, using
 * hard color stops (each color spans exactly its own band, no blending at
 * the boundary) rather than a smooth blend — a blended gradient would muddy
 * the boundary between two participants' colors, making it harder to read
 * "who has how much of this," which is the whole point of coloring the row.
 * Returns `undefined` when there's nothing to color (no positive-weight
 * shares).
 */
export function buildRowGradient(
	shares: WeightedShare[],
	colorOf: (id: string) => string,
	direction: string = 'to right'
): string | undefined {
	const positive = shares.filter((s) => s.weight > 0);
	if (positive.length === 0) return undefined;

	const total = positive.reduce((sum, s) => sum + s.weight, 0);
	let cursor = 0;
	const stops: string[] = [];
	for (const share of positive) {
		const start = round2((cursor / total) * 100);
		cursor += share.weight;
		const end = round2((cursor / total) * 100);
		const color = colorOf(share.id);
		stops.push(`${color} ${start}%`, `${color} ${end}%`);
	}
	return `linear-gradient(${direction}, ${stops.join(', ')})`;
}
