import { writable } from 'svelte/store';
import type { Quad } from '$lib/crop/warp';

export interface PendingPhoto {
	id: string;
	blob: Blob;
	/** Corners from the last confirmed crop, in the photo's own full-resolution pixel space. `null` until confirmed at least once. */
	lastCorners: Quad | null;
}

/** In-memory only, deliberately not persisted — see Global Constraints. */
export const pendingPhotos = writable<PendingPhoto[]>([]);

export function addPhotos(files: File[]): void {
	pendingPhotos.update((list) => [
		...list,
		...files.map((blob) => ({ id: crypto.randomUUID(), blob, lastCorners: null }))
	]);
}

export function removePhoto(id: string): void {
	pendingPhotos.update((list) => list.filter((p) => p.id !== id));
}

export function movePhoto(id: string, direction: 'up' | 'down'): void {
	pendingPhotos.update((list) => {
		const index = list.findIndex((p) => p.id === id);
		if (index === -1) return list;
		const target = direction === 'up' ? index - 1 : index + 1;
		if (target < 0 || target >= list.length) return list;
		const next = list.slice();
		[next[index], next[target]] = [next[target], next[index]];
		return next;
	});
}

export function setPhotoCorrection(id: string, correctedBlob: Blob, corners: Quad): void {
	pendingPhotos.update((list) =>
		list.map((p) => (p.id === id ? { ...p, blob: correctedBlob, lastCorners: corners } : p))
	);
}

export function clearPhotos(): void {
	pendingPhotos.set([]);
}
