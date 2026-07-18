import { writable, derived } from 'svelte/store';
import { participantColor } from '../colors';

export interface Participant {
	id: string;
	name: string;
}

export const participants = writable<Participant[]>([]);

export function addParticipant(name: string): void {
	participants.update((list) => [...list, { id: crypto.randomUUID(), name }]);
}

export function removeParticipant(id: string): void {
	participants.update((list) => list.filter((p) => p.id !== id));
}

export function renameParticipant(id: string, name: string): void {
	participants.update((list) => list.map((p) => (p.id === id ? { ...p, name } : p)));
}

export function setParticipantNames(names: string[]): void {
	participants.set(names.map((name) => ({ id: crypto.randomUUID(), name })));
}

export const participantColors = derived(participants, ($participants) => {
	const map = new Map<string, string>();
	$participants.forEach((p, i) => map.set(p.id, participantColor(i)));
	return map;
});
