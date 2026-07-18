import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	participants,
	addParticipant,
	removeParticipant,
	renameParticipant,
	setParticipantNames
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
});
