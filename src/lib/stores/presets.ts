import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { setParticipantNames } from './participants';

export interface GroupPreset {
	id: string;
	name: string;
	participantNames: string[];
}

const STORAGE_KEY = 'sliceceipt-group-presets';

function loadPresets(): GroupPreset[] {
	if (!browser) return [];
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export const presets = writable<GroupPreset[]>(loadPresets());

if (browser) {
	presets.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}

export function savePreset(name: string, participantNames: string[]): void {
	presets.update((list) => [...list, { id: crypto.randomUUID(), name, participantNames }]);
}

export function deletePreset(id: string): void {
	presets.update((list) => list.filter((p) => p.id !== id));
}

export function applyPreset(id: string): void {
	const preset = get(presets).find((p) => p.id === id);
	if (!preset) return;
	setParticipantNames(preset.participantNames);
}
