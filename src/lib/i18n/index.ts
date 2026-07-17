import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import en, { type Dictionary } from './translations/en';
import it from './translations/it';

export type Locale = 'en' | 'it';

const dictionaries: Record<Locale, Dictionary> = { en, it };

function isLocale(value: string | null): value is Locale {
	return value === 'en' || value === 'it';
}

function detectInitialLocale(): Locale {
	// Locale detection must never run during SSR/prerendering: the build
	// server's locale is unrelated to the visitor's, and baking it into the
	// static HTML would show the wrong language to everyone until hydration
	// corrects it. Verified: without this guard, a build machine configured
	// for Italian silently produces an Italian-only static page.
	if (!browser) return 'en';
	const saved = localStorage.getItem('locale');
	if (isLocale(saved)) return saved;
	if (navigator.language.startsWith('it')) return 'it';
	return 'en';
}

export const locale = writable<Locale>(detectInitialLocale());

if (browser) {
	locale.subscribe((value) => {
		localStorage.setItem('locale', value);
	});
}

export const t = derived(locale, ($locale) => {
	const dictionary = dictionaries[$locale];
	return (key: keyof Dictionary) => dictionary[key];
});
