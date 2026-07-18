import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { presets, savePreset, deletePreset, applyPreset } from './presets';
import { participants } from './participants';

describe('presets store', () => {
	it('saves a preset and lists it', () => {
		presets.set([]);
		savePreset('Casa', ['Alice', 'Bob']);
		const list = get(presets);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('Casa');
		expect(list[0].participantNames).toEqual(['Alice', 'Bob']);
	});

	it('deletes a preset by id', () => {
		presets.set([]);
		savePreset('Casa', ['Alice']);
		const id = get(presets)[0].id;
		deletePreset(id);
		expect(get(presets)).toHaveLength(0);
	});

	it('applying a preset replaces participants with fresh-id entries matching the preset names', () => {
		presets.set([]);
		participants.set([]);
		savePreset('Casa', ['Alice', 'Bob']);
		const id = get(presets)[0].id;
		applyPreset(id);
		expect(get(participants).map((p) => p.name)).toEqual(['Alice', 'Bob']);
	});

	it('applying an unknown preset id is a no-op', () => {
		presets.set([]);
		participants.set([{ id: 'x', name: 'Existing' }]);
		applyPreset('does-not-exist');
		expect(get(participants).map((p) => p.name)).toEqual(['Existing']);
	});
});
