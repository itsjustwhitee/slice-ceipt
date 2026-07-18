import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import type { ExtractDeps } from '$lib/extract';
import {
	step,
	mode,
	singleModeCount,
	extractionStatus,
	extractionError,
	parsedItems,
	groupItems,
	singleItems,
	groupTotals,
	singleTotal,
	setSingleModeCount,
	loadReceipt,
	skipExtraction,
	isSetupValid,
	confirmSetup,
	resetSession,
	MIN_PARTICIPANTS
} from './receipt';
import { participants, setParticipantNames } from './participants';

const fakeDeps: ExtractDeps = {
	extractTextFromPdfTextLayer: async () => '',
	renderPdfPagesToImages: async () => [],
	extractTextFromImage: async () => 'Bread 2.50\nMilk 1.20\n'
};

function resetAll() {
	resetSession();
	mode.set('group');
	singleModeCount.set(MIN_PARTICIPANTS);
	participants.set([]);
}

describe('receipt session store', () => {
	beforeEach(resetAll);

	it('clamps setSingleModeCount to at least MIN_PARTICIPANTS and rounds', () => {
		setSingleModeCount(1);
		expect(get(singleModeCount)).toBe(MIN_PARTICIPANTS);
		setSingleModeCount(4.7);
		expect(get(singleModeCount)).toBe(5);
	});

	it('loadReceipt extracts, parses, and advances to setup on success', async () => {
		const file = new File([new Uint8Array([1])], 'receipt.jpg', { type: 'image/jpeg' });
		await loadReceipt(file, fakeDeps);
		expect(get(extractionStatus)).toBe('idle');
		expect(get(extractionError)).toBeNull();
		expect(get(parsedItems).map((i) => i.name)).toEqual(['Bread', 'Milk']);
		expect(get(step)).toBe('setup');
	});

	it('loadReceipt records an error and stays on the upload step on failure', async () => {
		const file = new File([new Uint8Array([1])], 'receipt.jpg', { type: 'image/jpeg' });
		const failingDeps: ExtractDeps = {
			...fakeDeps,
			extractTextFromImage: async () => {
				throw new Error('ocr failed');
			}
		};
		await loadReceipt(file, failingDeps);
		expect(get(extractionStatus)).toBe('error');
		expect(get(extractionError)).toBe('ocr failed');
		expect(get(step)).toBe('upload');
	});

	it('skipExtraction leaves items empty and advances to setup', () => {
		skipExtraction();
		expect(get(parsedItems)).toEqual([]);
		expect(get(step)).toBe('setup');
	});

	it('isSetupValid requires at least MIN_PARTICIPANTS in group mode', () => {
		mode.set('group');
		setParticipantNames(['Alice']);
		expect(get(isSetupValid)).toBe(false);
		setParticipantNames(['Alice', 'Bob']);
		expect(get(isSetupValid)).toBe(true);
	});

	it('isSetupValid requires at least MIN_PARTICIPANTS in single mode', () => {
		mode.set('single');
		singleModeCount.set(1);
		expect(get(isSetupValid)).toBe(false);
		singleModeCount.set(2);
		expect(get(isSetupValid)).toBe(true);
	});

	it('confirmSetup builds group items from parsed items and advances to items step', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 250, quantity: 1 }]);
		confirmSetup();
		expect(get(step)).toBe('items');
		const items = get(groupItems);
		expect(items).toHaveLength(1);
		expect(items[0].units).toHaveLength(1);
		const totals = get(groupTotals);
		expect(totals.unassignedTotalCents).toBe(250);
		expect(get(participants)).toHaveLength(2);
	});

	it('confirmSetup builds single items from parsed items and advances to items step', () => {
		mode.set('single');
		singleModeCount.set(3);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		expect(get(step)).toBe('items');
		expect(get(singleItems)).toHaveLength(1);
		expect(get(singleTotal)).toBe(0);
	});

	it('confirmSetup is a no-op when setup is invalid', () => {
		mode.set('group');
		setParticipantNames(['Alice']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		expect(get(step)).toBe('upload');
		expect(get(groupItems)).toEqual([]);
	});

	it('resetSession clears items and returns to the upload step', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		resetSession();
		expect(get(step)).toBe('upload');
		expect(get(groupItems)).toEqual([]);
		expect(get(parsedItems)).toEqual([]);
	});
});
