import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Currency = 'EUR' | 'USD' | 'GBP';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP'];

function isCurrency(value: string | null): value is Currency {
	return value !== null && (CURRENCIES as string[]).includes(value);
}

function detectInitialCurrency(): Currency {
	if (!browser) return 'EUR';
	const saved = localStorage.getItem('currency');
	if (isCurrency(saved)) return saved;
	return 'EUR';
}

export const currency = writable<Currency>(detectInitialCurrency());

if (browser) {
	currency.subscribe((value) => {
		localStorage.setItem('currency', value);
	});
}
