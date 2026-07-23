import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { Quad } from '$lib/crop/warp';
import { pendingPhotos, addPhotos, removePhoto, movePhoto, setPhotoCorrection, clearPhotos } from './photos';

function fakeFile(name: string): File {
	return new File([new Uint8Array([1])], name, { type: 'image/jpeg' });
}

describe('photos store', () => {
	it('adds photos with generated ids and no prior crop', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg'), fakeFile('b.jpg')]);
		const list = get(pendingPhotos);
		expect(list).toHaveLength(2);
		expect(list[0].lastCorners).toBeNull();
		expect(list[0].id).toBeTruthy();
		expect(list[0].id).not.toBe(list[1].id);
	});

	it('appends to the existing batch rather than replacing it', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg')]);
		addPhotos([fakeFile('b.jpg')]);
		expect(get(pendingPhotos)).toHaveLength(2);
	});

	it('removes a photo by id', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg'), fakeFile('b.jpg')]);
		const [first] = get(pendingPhotos);
		removePhoto(first.id);
		const remaining = get(pendingPhotos);
		expect(remaining).toHaveLength(1);
		expect(remaining[0].id).not.toBe(first.id);
	});

	it('moves a photo up, swapping with its predecessor', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg'), fakeFile('b.jpg'), fakeFile('c.jpg')]);
		const [, second] = get(pendingPhotos);
		movePhoto(second.id, 'up');
		expect(get(pendingPhotos)[0].id).toBe(second.id);
	});

	it('is a no-op moving the first photo up or the last photo down', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg'), fakeFile('b.jpg')]);
		const before = get(pendingPhotos).map((p) => p.id);
		movePhoto(before[0], 'up');
		expect(get(pendingPhotos).map((p) => p.id)).toEqual(before);
		movePhoto(before[1], 'down');
		expect(get(pendingPhotos).map((p) => p.id)).toEqual(before);
	});

	it('replaces a photo blob and records the confirmed corners on correction', () => {
		clearPhotos();
		addPhotos([fakeFile('a.jpg')]);
		const [photo] = get(pendingPhotos);
		const correctedBlob = new Blob(['corrected']);
		const corners: Quad = [[0, 0], [10, 0], [10, 10], [0, 10]];
		setPhotoCorrection(photo.id, correctedBlob, corners);
		const updated = get(pendingPhotos)[0];
		expect(updated.blob).toBe(correctedBlob);
		expect(updated.lastCorners).toEqual(corners);
		expect(updated.id).toBe(photo.id);
	});

	it('clearPhotos empties the batch', () => {
		addPhotos([fakeFile('a.jpg')]);
		clearPhotos();
		expect(get(pendingPhotos)).toEqual([]);
	});
});
