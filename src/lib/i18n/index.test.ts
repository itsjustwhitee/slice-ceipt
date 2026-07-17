import { describe, expect, it as vitestIt } from 'vitest';
import { get } from 'svelte/store';
import { locale, t } from './index';

describe('i18n', () => {
	vitestIt('translates using the English dictionary', () => {
		locale.set('en');
		expect(get(t)('welcome')).toBe('Welcome to Receipt Splitter');
	});

	vitestIt('translates using the Italian dictionary after switching locale', () => {
		locale.set('it');
		expect(get(t)('welcome')).toBe('Benvenuto su Receipt Splitter');
	});
});
