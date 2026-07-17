/**
 * Formats `cents` as a localized currency string via the built-in
 * `Intl.NumberFormat` — no manual string assembly, no new dependency.
 * This is display-only: never feed the result back into a calculation.
 */
export function formatCents(cents: number, currency: string, locale: string): string {
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
