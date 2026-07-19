<!-- src/lib/components/SingleItemList.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { singleItems, singleTotal, step } from '$lib/stores/receipt';
	import {
		setItemFraction,
		setUnitFraction,
		applyFractionToAllItems,
		updateItemName,
		updateItemUnitPrice,
		updateItemQuantity,
		deleteItem,
		addItem
	} from '$lib/stores/single-items';
	import { formatCents } from '$lib/money';
	import type { Fraction } from '$lib/money';
	import { computeSingleGrandTotal } from '$lib/session';
	import { showToast } from '$lib/stores/toast';
	import SingleFractionPicker from './SingleFractionPicker.svelte';
	import AddItemModal from './AddItemModal.svelte';
	import PinnedTotalsBar from './PinnedTotalsBar.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';
	import PlusIcon from '$lib/icons/PlusIcon.svelte';
	import MinusIcon from '$lib/icons/MinusIcon.svelte';
	import GearIcon from '$lib/icons/GearIcon.svelte';

	let expandedItemId = $state<string | null>(null);
	let bulkPanelOpen = $state(false);
	let bulkFraction = $state<Fraction | null>(null);
	let editingPriceId = $state<string | null>(null);
	let priceDraft = $state('');
	let addModalOpen = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	function toggleExpanded(itemId: string) {
		expandedItemId = expandedItemId === itemId ? null : itemId;
	}

	function toggleBulkPanel() {
		bulkPanelOpen = !bulkPanelOpen;
		if (bulkPanelOpen) bulkFraction = null;
	}

	function applyBulk() {
		applyFractionToAllItems(bulkFraction);
		bulkPanelOpen = false;
	}

	function handleQuantityChange(itemId: string, value: string) {
		const quantity = Number(value);
		if (Number.isFinite(quantity)) updateItemQuantity(itemId, quantity);
	}

	function handlePriceChange(itemId: string, value: string) {
		const cents = Math.round(Number(value) * 100);
		if (Number.isFinite(cents)) updateItemUnitPrice(itemId, cents);
	}

	function startEditPrice(itemId: string, cents: number) {
		editingPriceId = itemId;
		priceDraft = (cents / 100).toFixed(2);
	}

	function commitPrice(itemId: string) {
		handlePriceChange(itemId, priceDraft);
		editingPriceId = null;
	}

	function handleAddItem(input: { name: string; unitPriceCents: number; quantity: number }) {
		addItem(input.name, input.unitPriceCents, input.quantity);
		addModalOpen = false;
		showToast($t('toastItemAdded').replace('{name}', input.name), 'success');
	}

	function requestDelete(itemId: string, name: string) {
		deleteTarget = { id: itemId, name };
	}

	function confirmDelete() {
		if (!deleteTarget) return;
		const { id, name } = deleteTarget;
		deleteItem(id);
		deleteTarget = null;
		showToast($t('toastItemDeleted').replace('{name}', name), 'danger');
	}

	function sameFraction(a: Fraction | null, b: Fraction | null): boolean {
		if (a === null || b === null) return a === b;
		return a.num === b.num && a.den === b.den;
	}

	function summarizeFraction(units: { fraction: Fraction | null }[]): string {
		const first = units[0].fraction;
		const allSame = units.every((u) => sameFraction(u.fraction, first));
		return allSame ? '' : $t('mixedShare');
	}

	function toggleInclude(itemId: string, currentlyIncluded: boolean) {
		setItemFraction(itemId, currentlyIncluded ? null : { num: 1, den: 1 });
	}

	let bulkOnlyMine = $derived(sameFraction(bulkFraction, { num: 1, den: 1 }));

	function toggleBulkOnlyMine() {
		bulkFraction = bulkOnlyMine ? null : { num: 1, den: 1 };
	}

	let pinnedPills = $derived([
		{ id: 'me', label: $t('yourTotal'), amountText: formatCents($singleTotal, $currency, $locale) }
	]);

	let unassignedPill = $derived.by(() => {
		const rest = computeSingleGrandTotal($singleItems) - $singleTotal;
		return rest > 0
			? { id: 'unassigned', label: $t('unassignedLabel'), amountText: formatCents(rest, $currency, $locale) }
			: undefined;
	});
</script>

<div class="card">
	<div class="toolbar">
		<button
			type="button"
			class="bulk-apply-trigger"
			aria-label={$t('bulkApply')}
			title={$t('bulkApply')}
			onclick={toggleBulkPanel}
		>
			<GearIcon size={16} />
		</button>
		<button
			type="button"
			class="add-item-trigger"
			aria-label={$t('addItem')}
			title={$t('addItem')}
			onclick={() => (addModalOpen = true)}
		>
			<AddIcon size={16} />
		</button>
	</div>

	{#if bulkPanelOpen}
		<div class="bulk-panel">
			<label class="only-mine">
				<input type="checkbox" checked={bulkOnlyMine} onclick={toggleBulkOnlyMine} />
				{$t('onlyMine')}
			</label>
			<SingleFractionPicker fraction={bulkFraction} onchange={(next) => (bulkFraction = next)} />
			<button type="button" class="bulk-apply-button" onclick={applyBulk}>{$t('bulkApplyButton')}</button>
		</div>
	{/if}

	<ul class="item-list">
		{#each $singleItems as item (item.id)}
			{@const included = item.units[0].fraction !== null}
			{@const summary = summarizeFraction(item.units)}
			<li class="item-row" class:is-unassigned={!included}>
				<div class="row-main">
					<div class="row-lead">
						<input
							type="checkbox"
							class="include-checkbox"
							aria-label={$t('nonMio')}
							checked={included}
							onclick={() => toggleInclude(item.id, included)}
						/>
					</div>
					<div class="row-fields">
						<input
							class="item-name"
							type="text"
							value={item.name}
							onchange={(e) => updateItemName(item.id, (e.target as HTMLInputElement).value)}
						/>
						<div class="qty-group">
							<span class="item-qty">×</span>
							<input
								class="item-quantity"
								type="number"
								min="1"
								value={item.quantity}
								onchange={(e) => handleQuantityChange(item.id, (e.target as HTMLInputElement).value)}
							/>
						</div>
						<input
							class="item-price"
							type="text"
							inputmode="decimal"
							value={editingPriceId === item.id
								? priceDraft
								: formatCents(item.unitPriceCents, $currency, $locale)}
							onfocus={() => startEditPrice(item.id, item.unitPriceCents)}
							oninput={(e) => (priceDraft = (e.target as HTMLInputElement).value)}
							onblur={() => commitPrice(item.id)}
							onkeydown={(e) => {
								if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
							}}
						/>
						<SingleFractionPicker
							fraction={item.units[0].fraction}
							onchange={(next) => setItemFraction(item.id, next)}
						/>
						{#if summary}<span class="fraction-display">{summary}</span>{/if}
					</div>
					<div class="row-trail">
						{#if item.quantity > 1}
							<button
								type="button"
								class="expand-toggle"
								aria-label={expandedItemId === item.id ? $t('collapse') : $t('expand')}
								title={expandedItemId === item.id ? $t('collapse') : $t('expand')}
								onclick={() => toggleExpanded(item.id)}
							>
								{#if expandedItemId === item.id}
									<MinusIcon size={11} />
								{:else}
									<PlusIcon size={11} />
								{/if}
							</button>
						{:else}
							<span class="expand-spacer"></span>
						{/if}
						<button
							type="button"
							class="icon-button is-danger"
							aria-label={$t('deleteItem')}
							title={$t('deleteItem')}
							onclick={() => requestDelete(item.id, item.name)}
						>
							<BinIcon size={16} />
						</button>
					</div>
				</div>

				{#if expandedItemId === item.id && item.quantity > 1}
					<div class="unit-list">
						{#each item.units as unit, i (i)}
							{@const unitIncluded = unit.fraction !== null}
							<div class="unit-row">
								<input
									type="checkbox"
									class="include-checkbox"
									aria-label={$t('nonMio')}
									checked={unitIncluded}
									onclick={() => setUnitFraction(item.id, i, unitIncluded ? null : { num: 1, den: 1 })}
								/>
								<span class="unit-label">{$t('unitLabel')} {i + 1}</span>
								<SingleFractionPicker
									fraction={unit.fraction}
									onchange={(next) => setUnitFraction(item.id, i, next)}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<button class="continue" type="button" onclick={() => step.set('summary')}>{$t('itemsContinue')}</button>
</div>

<AddItemModal open={addModalOpen} onadd={handleAddItem} onclose={() => (addModalOpen = false)} />
<ConfirmDialog
	open={deleteTarget !== null}
	message={deleteTarget ? $t('confirmDeleteItem').replace('{name}', deleteTarget.name) : ''}
	onconfirm={confirmDelete}
	oncancel={() => (deleteTarget = null)}
/>
<PinnedTotalsBar pills={pinnedPills} trailingPill={unassignedPill} />

<style>
	.card {
		padding-bottom: 7rem;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.bulk-apply-trigger,
	.add-item-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bulk-panel {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
	}

	.only-mine {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.bulk-apply-button {
		margin-top: 0.75rem;
	}

	.item-list {
		list-style: none;
		margin: 1.5rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.item-row {
		padding: 0.6rem 0.6rem;
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
		border-left: 3px solid var(--color-accent);
		border-bottom: 1px solid color-mix(in srgb, var(--color-text-on-surface) 10%, transparent);
		transition: background-color 0.25s ease-out, border-color 0.25s ease-out;
	}

	.item-row:first-child {
		border-top-left-radius: 10px;
		border-top-right-radius: 10px;
	}

	.item-row:last-child {
		border-bottom: none;
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
	}

	.item-row.is-unassigned {
		opacity: 0.6;
		background: transparent;
		border-left-color: transparent;
	}

	.row-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
	}

	.row-lead,
	.row-trail {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.row-fields {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.expand-toggle,
	.expand-spacer {
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.2em;
		border: none;
		background: transparent;
	}

	.include-checkbox {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		accent-color: var(--color-accent);
	}

	.item-name {
		flex: 1 1 10ch;
		min-width: 8ch;
	}

	.qty-group {
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}

	.item-qty {
		opacity: 0.6;
	}

	.item-quantity {
		width: 3ch;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.item-quantity::-webkit-inner-spin-button,
	.item-quantity::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.item-price {
		width: 8ch;
	}

	.item-name,
	.item-quantity,
	.item-price {
		font: inherit;
		font-family: inherit;
		padding: 0.2em 0.3em;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		color: inherit;
		transition: background-color 0.2s ease-out, border-color 0.2s ease-out;
	}

	.item-name:hover,
	.item-quantity:hover,
	.item-price:hover {
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
	}

	.item-name:focus,
	.item-quantity:focus,
	.item-price:focus {
		outline: none;
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
	}

	.fraction-display {
		font-size: 0.85rem;
		font-weight: 600;
		opacity: 0.75;
	}

	.unit-list {
		margin: 0.5rem 0 0.25rem 1.5rem;
		padding-left: 0.75rem;
		border-left: 1px solid color-mix(in srgb, var(--color-text-on-surface) 15%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.unit-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.unit-label {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.7;
		min-width: 5ch;
	}

	.continue {
		margin-top: 1.5rem;
		width: 100%;
	}
</style>
