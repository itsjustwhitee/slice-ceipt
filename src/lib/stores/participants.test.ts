import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { PARTICIPANT_COLORS } from '../colors';
import {
	participants,
	addParticipant,
	removeParticipant,
	renameParticipant,
	setParticipantNames,
	participantColors
} from './participants';

describe('participants store', () => {
	it('adds a participant with a generated id', () => {
		participants.set([]);
		addParticipant('Alice');
		const list = get(participants);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('Alice');
		expect(list[0].id).toBeTruthy();
	});

	it('removes a participant by id', () => {
		participants.set([]);
		addParticipant('Alice');
		addParticipant('Bob');
		const bobId = get(participants)[1].id;
		removeParticipant(bobId);
		expect(get(participants).map((p) => p.name)).toEqual(['Alice']);
	});

	it('renames a participant by id', () => {
		participants.set([]);
		addParticipant('Alice');
		const aliceId = get(participants)[0].id;
		renameParticipant(aliceId, 'Alicia');
		expect(get(participants)[0].name).toBe('Alicia');
	});

	it('replaces the whole list with fresh ids via setParticipantNames', () => {
		setParticipantNames(['A', 'B', 'C']);
		const list = get(participants);
		expect(list.map((p) => p.name)).toEqual(['A', 'B', 'C']);
		const ids = new Set(list.map((p) => p.id));
		expect(ids.size).toBe(3);
	});

	it('maps each participant id to a color by their position', () => {
		setParticipantNames(['Alice', 'Bob']);
		const [alice, bob] = get(participants);
		const colors = get(participantColors);
		expect(colors.get(alice.id)).toBe(PARTICIPANT_COLORS[0]);
		expect(colors.get(bob.id)).toBe(PARTICIPANT_COLORS[1]);
	});

	it('updates reactively when participants change', () => {
		setParticipantNames(['Alice']);
		expect(get(participantColors).size).toBe(1);
		setParticipantNames(['Alice', 'Bob', 'Carol']);
		expect(get(participantColors).size).toBe(3);
	});
});
