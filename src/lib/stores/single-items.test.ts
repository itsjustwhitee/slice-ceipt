import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { singleItems } from './receipt';
import {
	setUnitFraction,
	setItemFraction,
	applyFractionToAllItems,
	updateItemName,
	updateItemUnitPrice,
	updateItemQuantity,
	deleteItem,
	addItem
} from './single-items';

function seed() {
	singleItems.set([
		{ id: 'item-0', name: 'Bread', unitPriceCents: 250, quantity: 1, units: [{ fraction: null }] },
		{
			id: 'item-1',
			name: 'Milk',
			unitPriceCents: 120,
			quantity: 2,
			units: [{ fraction: null }, { fraction: null }]
		}
	]);
}

describe('single-items store actions', () => {
	beforeEach(seed);

	it('sets a single unit fraction without affecting other units', () => {
		setUnitFraction('item-1', 0, { num: 1, den: 2 });
		const items = get(singleItems);
		expect(items[1].units[0].fraction).toEqual({ num: 1, den: 2 });
		expect(items[1].units[1].fraction).toBeNull();
	});

	it('sets the same fraction across every unit of an item (macro split)', () => {
		setItemFraction('item-1', { num: 1, den: 3 });
		const items = get(singleItems);
		expect(items[1].units[0].fraction).toEqual({ num: 1, den: 3 });
		expect(items[1].units[1].fraction).toEqual({ num: 1, den: 3 });
	});

	it('applies a fraction to every item at once (seleziona tutto come)', () => {
		applyFractionToAllItems({ num: 1, den: 2 });
		const items = get(singleItems);
		expect(items[0].units[0].fraction).toEqual({ num: 1, den: 2 });
		expect(items[1].units[0].fraction).toEqual({ num: 1, den: 2 });
		expect(items[1].units[1].fraction).toEqual({ num: 1, den: 2 });
	});

	it('applying null to every item clears them all ("non mio")', () => {
		applyFractionToAllItems({ num: 1, den: 1 });
		applyFractionToAllItems(null);
		const items = get(singleItems);
		expect(items[0].units[0].fraction).toBeNull();
		expect(items[1].units[1].fraction).toBeNull();
	});

	it('updates an item name in place', () => {
		updateItemName('item-0', 'Sourdough Bread');
		expect(get(singleItems)[0].name).toBe('Sourdough Bread');
	});

	it('updates an item unit price in place', () => {
		updateItemUnitPrice('item-0', 300);
		expect(get(singleItems)[0].unitPriceCents).toBe(300);
	});

	it('changing quantity regenerates units, resetting fractions for that item', () => {
		setUnitFraction('item-1', 0, { num: 1, den: 2 });
		updateItemQuantity('item-1', 3);
		const item = get(singleItems)[1];
		expect(item.quantity).toBe(3);
		expect(item.units).toHaveLength(3);
		expect(item.units.every((u) => u.fraction === null)).toBe(true);
	});

	it('clamps quantity to a minimum of 1', () => {
		updateItemQuantity('item-1', 0);
		expect(get(singleItems)[1].quantity).toBe(1);
	});

	it('deletes an item by id', () => {
		deleteItem('item-0');
		expect(get(singleItems).map((i) => i.id)).toEqual(['item-1']);
	});

	it('adds a manually-entered item with fresh unfractioned units', () => {
		addItem('Eggs', 400, 2);
		const items = get(singleItems);
		expect(items).toHaveLength(3);
		const added = items[2];
		expect(added.name).toBe('Eggs');
		expect(added.unitPriceCents).toBe(400);
		expect(added.quantity).toBe(2);
		expect(added.units).toHaveLength(2);
		expect(added.units.every((u) => u.fraction === null)).toBe(true);
	});
});
