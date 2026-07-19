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

/**
 * Builds the mode-appropriate item tree from the parsed items and advances
 * to the item-tree step. Only builds from scratch the first time for the
 * current mode — if the user already has a group/single item tree (they
 * went `items` -> `setup` via `goBack` and are now confirming again), this
 * reuses it instead of rebuilding, so edits, manual items, and assignments
 * already made aren't discarded. Adding a participant needs no special
 * handling (they simply become selectable in the existing tree); removing
 * one is likewise handled for free by the split engine, which already
 * ignores any assignment entry for an id no longer in the current
 * participant list. Switching `mode` is the one case that still rebuilds
 * from scratch, since a group item tree and a single item tree are
 * different shapes.
 */
export function confirmSetup(): void {
	if (!get(isSetupValid)) return;
	const parsed = get(parsedItems);
	if (get(mode) === 'group') {
		if (get(groupItems).length === 0) {
			groupItems.set(createGroupItemsFromParsed(parsed, get(participants).map((p) => p.id)));
		}
	} else {
		if (get(singleItems).length === 0) {
			singleItems.set(createSingleItemsFromParsed(parsed, get(singleModeCount)));
		}
	}
	step.set('items');
}

/**
 * Steps back one stage (`setup` -> `upload`, `items` -> `setup`, `summary`
 * -> `items`) without discarding any work, unlike `resetSession` — nothing
 * here clears `parsedItems`/`groupItems`/`singleItems`. Re-confirming setup
 * afterward is handled by `confirmSetup` itself (see its own doc comment).
 */
export function goBack(): void {
	const current = get(step);
	if (current === 'setup') step.set('upload');
	else if (current === 'items') step.set('setup');
	else if (current === 'summary') step.set('items');
}

export function resetSession(): void {
	step.set('upload');
	extractionStatus.set('idle');
	extractionError.set(null);
	parsedItems.set([]);
	groupItems.set([]);
	singleItems.set([]);
}
