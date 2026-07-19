import { describe, expect, it } from 'vitest';
import { weightPercentages } from './weight-share';

describe('weightPercentages', () => {
	it('turns weights into rounded percentages of their sum', () => {
		const result = weightPercentages(new Map([['alice', 1], ['bob', 2]]));
		expect(result.get('alice')).toBe(33);
		expect(result.get('bob')).toBe(67);
	});

	it('gives a single participant 100%', () => {
		const result = weightPercentages(new Map([['alice', 5]]));
		expect(result.get('alice')).toBe(100);
	});

	it('returns an empty map for no weights', () => {
		expect(weightPercentages(new Map()).size).toBe(0);
	});
});
