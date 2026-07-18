import { derived, get, writable } from 'svelte/store';
import { extractReceiptText, type ExtractDeps } from '$lib/extract';
import { parseReceiptText, type ParsedItem } from '$lib/parsing';
import {
	createGroupItemsFromParsed,
	computeGroupTotals,
	createSingleItemsFromParsed,
	computeSingleTotal,
	type GroupItem,
	type SingleItem
} from '$lib/session';
import { participants } from './participants';

export type Mode = 'group' | 'single';
export type Step = 'upload' | 'setup' | 'items' | 'summary';
export type ExtractionStatus = 'idle' | 'extracting' | 'error';

export const MIN_PARTICIPANTS = 2;

export const step = writable<Step>('upload');
export const mode = writable<Mode>('group');
export const singleModeCount = writable<number>(MIN_PARTICIPANTS);
export const extractionStatus = writable<ExtractionStatus>('idle');
export const extractionError = writable<string | null>(null);
export const parsedItems = writable<ParsedItem[]>([]);
export const groupItems = writable<GroupItem[]>([]);
export const singleItems = writable<SingleItem[]>([]);

export const groupTotals = derived([groupItems, participants], ([$groupItems, $participants]) =>
	computeGroupTotals(
		$groupItems,
		$participants.map((p) => p.id)
	)
);

export const singleTotal = derived(singleItems, ($singleItems) => computeSingleTotal($singleItems));

/**
 * A derived store, not a plain function: `SetupStep.svelte` binds `$isSetupValid`
 * directly so the "Continue" button and validation hint stay reactive as
 * participants/count change. A plain function that called `get(...)`
 * internally would not re-run when the template re-renders, since Svelte's
 * `$store` auto-subscription is compiler-driven and only triggers on the
 * `$name` syntax, not on arbitrary code that happens to read a store.
 */
export const isSetupValid = derived(
	[mode, participants, singleModeCount],
	([$mode, $participants, $singleModeCount]) =>
		$mode === 'group' ? $participants.length >= MIN_PARTICIPANTS : $singleModeCount >= MIN_PARTICIPANTS
);

export function setSingleModeCount(count: number): void {
	singleModeCount.set(Math.max(MIN_PARTICIPANTS, Math.round(count)));
}

/**
 * Runs OCR/PDF extraction + parsing for a freshly selected receipt file and
 * advances to the setup step on success. `deps` is injectable (mirrors
 * `$lib/extract`'s own pattern) so this orchestration can be unit-tested
 * without real Tesseract/pdf.js execution.
 */
export async function loadReceipt(file: File, deps?: ExtractDeps): Promise<void> {
	extractionStatus.set('extracting');
	extractionError.set(null);
	try {
		const text = deps ? await extractReceiptText(file, deps) : await extractReceiptText(file);
		parsedItems.set(parseReceiptText(text));
		extractionStatus.set('idle');
		step.set('setup');
	} catch (err) {
		extractionStatus.set('error');
		extractionError.set(err instanceof Error ? err.message : String(err));
	}
}

/** Per spec's "falls back gracefully... or is skipped": bypasses extraction entirely, leaving items empty for full manual entry in the item tree. */
export function skipExtraction(): void {
	parsedItems.set([]);
	extractionStatus.set('idle');
	extractionError.set(null);
	step.set('setup');
}

/** Builds the mode-appropriate item tree from the parsed items and advances to the item-tree step. Called once, when the user confirms mode + participants/count. */
export function confirmSetup(): void {
	if (!get(isSetupValid)) return;
	const parsed = get(parsedItems);
	if (get(mode) === 'group') {
		groupItems.set(createGroupItemsFromParsed(parsed, get(participants).map((p) => p.id)));
	} else {
		singleItems.set(createSingleItemsFromParsed(parsed, get(singleModeCount)));
	}
	step.set('items');
}

export function resetSession(): void {
	step.set('upload');
	extractionStatus.set('idle');
	extractionError.set(null);
	parsedItems.set([]);
	groupItems.set([]);
	singleItems.set([]);
}
