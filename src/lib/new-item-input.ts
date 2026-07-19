export interface NewItemInput {
	name: string;
	unitPriceCents: number;
	quantity: number;
}

/**
 * Shared validation for the "add item" modal, used identically by both
 * single- and group-mode item lists (previously duplicated inline in each
 * component's `submitAddItem`). Returns `null` for anything invalid, which
 * the caller treats as "don't submit yet."
 */
export function parseNewItemInput(name: string, price: string, quantity: string): NewItemInput | null {
	const trimmedName = name.trim();
	if (!trimmedName) return null;

	const unitPriceCents = Math.round(Number(price) * 100);
	if (!Number.isFinite(unitPriceCents) || unitPriceCents <= 0) return null;

	const parsedQuantity = Math.round(Number(quantity));
	if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) return null;

	return { name: trimmedName, unitPriceCents, quantity: parsedQuantity };
}
