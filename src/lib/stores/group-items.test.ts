import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { groupItems } from './receipt';
import {
	setUnitAssignment,
	setItemAssignment,
	applyAssignmentToAllItems,
	updateItemName,
	updateItemUnitPrice,
	updateItemQuantity,
	deleteItem,
	addItem
} from './group-items';

function seed() {
	groupItems.set([
		{ id: 'item-0', name: 'Bread', unitPriceCents: 250, quantity: 1, units: [{ assignment: new Map() }] },
		{
			id: 'item-1',
			name: 'Milk',
			unitPriceCents: 120,
			quantity: 2,
			units: [{ assignment: new Map() }, { assignment: new Map() }]
		}
	]);
}

describe('group-items store actions', () => {
	beforeEach(seed);

	it('sets a single unit assignment without affecting other units', () => {
		setUnitAssignment('item-1', 0, new Map([['alice', 1]]));
		const items = get(groupItems);
		expect(items[1].units[0].assignment.get('alice')).toBe(1);
		expect(items[1].units[1].assignment.size).toBe(0);
	});

	it('sets the same assignment across every unit of an item (macro split)', () => {
		setItemAssignment('item-1', new Map([['alice', 1], ['bob', 1]]));
		const items = get(groupItems);
		expect(items[1].units[0].assignment.get('bob')).toBe(1);
		expect(items[1].units[1].assignment.get('bob')).toBe(1);
	});

	it('applies an assignment to every item at once (seleziona tutto come)', () => {
		applyAssignmentToAllItems(new Map([['alice', 1]]));
		const items = get(groupItems);
		expect(items[0].units[0].assignment.get('alice')).toBe(1);
		expect(items[1].units[0].assignment.get('alice')).toBe(1);
		expect(items[1].units[1].assignment.get('alice')).toBe(1);
	});

	it('updates an item name in place', () => {
		updateItemName('item-0', 'Sourdough Bread');
		expect(get(groupItems)[0].name).toBe('Sourdough Bread');
	});

	it('updates an item unit price in place', () => {
		updateItemUnitPrice('item-0', 300);
		expect(get(groupItems)[0].unitPriceCents).toBe(300);
	});

	it('changing quantity regenerates units, resetting assignments for that item', () => {
		setUnitAssignment('item-1', 0, new Map([['alice', 1]]));
		updateItemQuantity('item-1', 3);
		const item = get(groupItems)[1];
		expect(item.quantity).toBe(3);
		expect(item.units).toHaveLength(3);
		expect(item.units.every((u) => u.assignment.size === 0)).toBe(true);
	});

	it('clamps quantity to a minimum of 1', () => {
		updateItemQuantity('item-1', 0);
		expect(get(groupItems)[1].quantity).toBe(1);
	});

	it('deletes an item by id', () => {
		deleteItem('item-0');
		expect(get(groupItems).map((i) => i.id)).toEqual(['item-1']);
	});

	it('adds a manually-entered item with fresh unassigned units', () => {
		addItem('Eggs', 400, 2);
		const items = get(groupItems);
		expect(items).toHaveLength(3);
		const added = items[2];
		expect(added.name).toBe('Eggs');
		expect(added.unitPriceCents).toBe(400);
		expect(added.quantity).toBe(2);
		expect(added.units).toHaveLength(2);
		expect(added.units.every((u) => u.assignment.size === 0)).toBe(true);
	});
});
