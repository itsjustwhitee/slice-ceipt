import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function isTheme(value: string | null): value is Theme {
	return value === 'light' || value === 'dark';
}

function detectInitialTheme(): Theme {
	// Theme detection must never run during SSR/prerendering, same reasoning
	// as locale detection: the build server has no meaningful preference, and
	// baking one into the static HTML would flash the wrong theme for anyone
	// who disagrees with it until hydration corrects it.
	if (!browser) return 'dark';
	const saved = localStorage.getItem('theme');
	if (isTheme(saved)) return saved;
	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const theme = writable<Theme>(detectInitialTheme());

if (browser) {
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		document.documentElement.setAttribute('data-theme', value);
	});
}
