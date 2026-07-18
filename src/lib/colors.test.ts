import { describe, expect, it } from 'vitest';
import { PARTICIPANT_COLORS, participantColor } from './colors';

describe('participantColor', () => {
	it('returns a distinct color for each index within the palette size', () => {
		const colors = PARTICIPANT_COLORS.map((_, i) => participantColor(i));
		expect(new Set(colors).size).toBe(PARTICIPANT_COLORS.length);
	});

	it('cycles the palette for indices beyond its length', () => {
		expect(participantColor(PARTICIPANT_COLORS.length)).toBe(participantColor(0));
		expect(participantColor(PARTICIPANT_COLORS.length + 3)).toBe(participantColor(3));
	});
});
