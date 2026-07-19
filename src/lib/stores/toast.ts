import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'danger';

export interface ToastMessage {
	id: string;
	text: string;
	variant: ToastVariant;
}

export const toasts = writable<ToastMessage[]>([]);

let nextId = 0;

/** Shows a toast for `durationMs`, then removes it. Multiple toasts stack. */
export function showToast(text: string, variant: ToastVariant, durationMs = 3000): void {
	const id = `toast-${nextId++}`;
	toasts.update((list) => [...list, { id, text, variant }]);
	setTimeout(() => {
		toasts.update((list) => list.filter((t) => t.id !== id));
	}, durationMs);
}
