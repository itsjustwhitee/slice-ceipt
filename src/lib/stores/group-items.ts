import { groupItems } from './receipt';

export function setUnitAssignment(
	itemId: string,
	unitIndex: number,
	assignment: Map<string, number>
): void {
	groupItems.update((items) =>
		items.map((item) =>
			item.id !== itemId
				? item
				: {
						...item,
						units: item.units.map((unit, i) =>
							i !== unitIndex ? unit : { assignment: new Map(assignment) }
						)
					}
		)
	);
}

export function setItemAssignment(itemId: string, assignment: Map<string, number>): void {
	groupItems.update((items) =>
		items.map((item) =>
			item.id !== itemId
				? item
				: { ...item, units: item.units.map(() => ({ assignment: new Map(assignment) })) }
		)
	);
}

export function applyAssignmentToAllItems(assignment: Map<string, number>): void {
	groupItems.update((items) =>
		items.map((item) => ({
			...item,
			units: item.units.map(() => ({ assignment: new Map(assignment) }))
		}))
	);
}

export function updateItemName(itemId: string, name: string): void {
	groupItems.update((items) => items.map((item) => (item.id === itemId ? { ...item, name } : item)));
}

export function updateItemUnitPrice(itemId: string, unitPriceCents: number): void {
	groupItems.update((items) =>
		items.map((item) => (item.id === itemId ? { ...item, unitPriceCents } : item))
	);
}

export function updateItemQuantity(itemId: string, quantity: number): void {
	const safeQuantity = Math.max(1, Math.round(quantity));
	groupItems.update((items) =>
		items.map((item) =>
			item.id !== itemId
				? item
				: {
						...item,
						quantity: safeQuantity,
						units: Array.from({ length: safeQuantity }, () => ({ assignment: new Map() }))
					}
		)
	);
}

export function deleteItem(itemId: string): void {
	groupItems.update((items) => items.filter((item) => item.id !== itemId));
}

let nextManualItemId = 0;

export function addItem(name: string, unitPriceCents: number, quantity: number): void {
	const safeQuantity = Math.max(1, Math.round(quantity));
	groupItems.update((items) => [
		...items,
		{
			id: `manual-${nextManualItemId++}`,
			name,
			unitPriceCents,
			quantity: safeQuantity,
			units: Array.from({ length: safeQuantity }, () => ({ assignment: new Map() }))
		}
	]);
}
