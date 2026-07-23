import { describe, expect, it, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { ExtractDeps } from '$lib/extract';
import {
	step,
	mode,
	singleModeCount,
	extractionStatus,
	extractionError,
	extractionProgress,
	parsedItems,
	groupItems,
	singleItems,
	groupTotals,
	singleTotal,
	setSingleModeCount,
	loadReceipt,
	loadReceiptFromPhotos,
	skipExtraction,
	isSetupValid,
	confirmSetup,
	resetSession,
	goBack,
	MIN_PARTICIPANTS
} from './receipt';
import { participants, setParticipantNames, addParticipant, removeParticipant } from './participants';
import { setItemAssignment } from './group-items';
import { pendingPhotos, addPhotos } from './photos';

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

	it('loadReceipt tracks OCR progress through to completion', async () => {
		const file = new File([new Uint8Array([1])], 'receipt.jpg', { type: 'image/jpeg' });
		const progressDeps: ExtractDeps = {
			...fakeDeps,
			extractTextFromImage: async (_image, onProgress) => {
				onProgress?.(0.5);
				onProgress?.(1);
				return 'Bread 2.50\n';
			}
		};
		await loadReceipt(file, progressDeps);
		expect(get(extractionProgress)).toBe(1);
	});

	it('loadReceipt resets progress to 0 at the start of a new extraction', async () => {
		const file = new File([new Uint8Array([1])], 'receipt.jpg', { type: 'image/jpeg' });
		extractionProgress.set(0.75);
		await loadReceipt(file, fakeDeps);
		// fakeDeps never calls onProgress, so it should stay at the reset value (0), not the stale 0.75
		expect(get(extractionProgress)).toBe(0);
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

	it('loadReceiptFromPhotos extracts each photo, joins the text, parses, and advances to setup', async () => {
		const photos = [
			{ id: 'p1', blob: new Blob(['x']), lastCorners: null },
			{ id: 'p2', blob: new Blob(['y']), lastCorners: null }
		];
		const deps: ExtractDeps = {
			...fakeDeps,
			extractTextFromImage: vi.fn().mockResolvedValueOnce('Bread 2.50\n').mockResolvedValueOnce('Milk 1.20\n')
		};
		await loadReceiptFromPhotos(photos, deps);
		expect(get(parsedItems).map((i) => i.name)).toEqual(['Bread', 'Milk']);
		expect(get(step)).toBe('setup');
	});

	it('loadReceiptFromPhotos records an error and stays on the upload step on failure', async () => {
		const photos = [{ id: 'p1', blob: new Blob(['x']), lastCorners: null }];
		const deps: ExtractDeps = {
			...fakeDeps,
			extractTextFromImage: async () => {
				throw new Error('ocr failed');
			}
		};
		await loadReceiptFromPhotos(photos, deps);
		expect(get(extractionStatus)).toBe('error');
		expect(get(extractionError)).toBe('ocr failed');
		expect(get(step)).toBe('upload');
	});

	it('resetSession also clears the pending photo batch', () => {
		addPhotos([new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })]);
		resetSession();
		expect(get(pendingPhotos)).toEqual([]);
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

	it('goBack steps back one stage without clearing any data', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);

		step.set('setup');
		goBack();
		expect(get(step)).toBe('upload');
		expect(get(parsedItems)).toHaveLength(1);

		step.set('items');
		goBack();
		expect(get(step)).toBe('setup');

		step.set('summary');
		goBack();
		expect(get(step)).toBe('items');
	});

	it('confirmSetup reuses the existing group item tree instead of rebuilding when re-confirming (goBack then forward)', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		const [alice] = get(participants);
		setItemAssignment(get(groupItems)[0].id, new Map([[alice.id, 1]]));

		goBack();
		expect(get(step)).toBe('setup');
		confirmSetup();

		expect(get(step)).toBe('items');
		expect(get(groupItems)[0].units[0].assignment.get(alice.id)).toBe(1);
	});

	it('confirmSetup keeps existing assignments when a new participant is added after goBack', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		const [alice] = get(participants);
		setItemAssignment(get(groupItems)[0].id, new Map([[alice.id, 1]]));

		goBack();
		addParticipant('Chiara');
		confirmSetup();

		expect(get(participants)).toHaveLength(3);
		expect(get(groupItems)[0].units[0].assignment.get(alice.id)).toBe(1);
		expect(get(groupTotals).totals.get(alice.id)).toBe(300);
	});

	it('confirmSetup recalculates totals correctly when a participant is removed after goBack', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();
		const [alice, bob] = get(participants);
		setItemAssignment(get(groupItems)[0].id, new Map([[alice.id, 1], [bob.id, 1]]));
		expect(get(groupTotals).totals.get(alice.id)).toBe(150);

		goBack();
		removeParticipant(bob.id);
		confirmSetup();

		expect(get(participants)).toHaveLength(1);
		expect(get(groupTotals).totals.get(alice.id)).toBe(300);
	});

	it('confirmSetup rebuilds from scratch when the mode changes after goBack', () => {
		mode.set('group');
		setParticipantNames(['Alice', 'Bob']);
		parsedItems.set([{ name: 'Bread', unitPriceCents: 300, quantity: 1 }]);
		confirmSetup();

		goBack();
		mode.set('single');
		singleModeCount.set(2);
		confirmSetup();

		expect(get(singleItems)).toHaveLength(1);
		expect(get(step)).toBe('items');
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
