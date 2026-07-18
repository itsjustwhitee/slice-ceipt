import { singleItems } from './receipt';
import type { Fraction } from '$lib/money';

export function setUnitFraction(itemId: string, unitIndex: number, fraction: Fraction | null): void {
	singleItems.update((items) =>
		items.map((item) =>
			item.id !== itemId
				? item
				: {
						...item,
						units: item.units.map((unit, i) => (i !== unitIndex ? unit : { fraction }))
					}
		)
	);
}

export function setItemFraction(itemId: string, fraction: Fraction | null): void {
	singleItems.update((items) =>
		items.map((item) =>
			item.id !== itemId ? item : { ...item, units: item.units.map(() => ({ fraction })) }
		)
	);
}

export function applyFractionToAllItems(fraction: Fraction | null): void {
	singleItems.update((items) =>
		items.map((item) => ({ ...item, units: item.units.map(() => ({ fraction })) }))
	);
}

export function updateItemName(itemId: string, name: string): void {
	singleItems.update((items) => items.map((item) => (item.id === itemId ? { ...item, name } : item)));
}

export function updateItemUnitPrice(itemId: string, unitPriceCents: number): void {
	singleItems.update((items) =>
		items.map((item) => (item.id === itemId ? { ...item, unitPriceCents } : item))
	);
}

export function updateItemQuantity(itemId: string, quantity: number): void {
	const safeQuantity = Math.max(1, Math.round(quantity));
	singleItems.update((items) =>
		items.map((item) =>
			item.id !== itemId
				? item
				: {
						...item,
						quantity: safeQuantity,
						units: Array.from({ length: safeQuantity }, () => ({ fraction: null }))
					}
		)
	);
}

export function deleteItem(itemId: string): void {
	singleItems.update((items) => items.filter((item) => item.id !== itemId));
}

let nextManualItemId = 0;

export function addItem(name: string, unitPriceCents: number, quantity: number): void {
	const safeQuantity = Math.max(1, Math.round(quantity));
	singleItems.update((items) => [
		...items,
		{
			id: `manual-${nextManualItemId++}`,
			name,
			unitPriceCents,
			quantity: safeQuantity,
			units: Array.from({ length: safeQuantity }, () => ({ fraction: null }))
		}
	]);
}
