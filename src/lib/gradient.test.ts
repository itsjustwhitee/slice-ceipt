import { describe, expect, it } from 'vitest';
import { buildRowGradient } from './gradient';

describe('buildRowGradient', () => {
	const colorOf = (id: string) => (id === 'a' ? '#111111' : '#222222');

	it('returns undefined for no shares', () => {
		expect(buildRowGradient([], colorOf)).toBeUndefined();
	});

	it('builds a single hard-stop color band for one share', () => {
		expect(buildRowGradient([{ id: 'a', weight: 1 }], colorOf)).toBe(
			'linear-gradient(to right, #111111 0%, #111111 100%)'
		);
	});

	it('splits proportionally by weight, in the given order, as hard stops', () => {
		expect(buildRowGradient([{ id: 'a', weight: 1 }, { id: 'b', weight: 2 }], colorOf)).toBe(
			'linear-gradient(to right, #111111 0%, #111111 33.33%, #222222 33.33%, #222222 100%)'
		);
	});

	it('supports a custom direction', () => {
		expect(buildRowGradient([{ id: 'a', weight: 1 }, { id: 'b', weight: 1 }], colorOf, 'to bottom')).toBe(
			'linear-gradient(to bottom, #111111 0%, #111111 50%, #222222 50%, #222222 100%)'
		);
	});

	it('ignores zero-weight shares', () => {
		expect(buildRowGradient([{ id: 'a', weight: 0 }, { id: 'b', weight: 1 }], colorOf)).toBe(
			'linear-gradient(to right, #222222 0%, #222222 100%)'
		);
	});

	it('builds one blended stop per share at its band midpoint when soft is true', () => {
		expect(buildRowGradient([{ id: 'a', weight: 1 }, { id: 'b', weight: 1 }], colorOf, 'to right', true)).toBe(
			'linear-gradient(to right, #111111 25%, #222222 75%)'
		);
	});

	it('weights soft midpoints proportionally too, not just evenly', () => {
		expect(buildRowGradient([{ id: 'a', weight: 1 }, { id: 'b', weight: 2 }], colorOf, 'to right', true)).toBe(
			'linear-gradient(to right, #111111 16.67%, #222222 66.66%)'
		);
	});
});
