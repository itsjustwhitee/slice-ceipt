<!-- src/lib/components/GroupItemList.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { groupItems, groupTotals, step } from '$lib/stores/receipt';
	import { participants, participantColors } from '$lib/stores/participants';
	import { aggregateItemAssignment } from '$lib/session';
	import { buildRowGradient } from '$lib/gradient';
	import {
		setItemAssignment,
		setUnitAssignment,
		applyAssignmentToAllItems,
		updateItemName,
		updateItemUnitPrice,
		updateItemQuantity,
		deleteItem,
		addItem
	} from '$lib/stores/group-items';
	import { formatCents } from '$lib/money';
	import { showToast } from '$lib/stores/toast';
	import GroupAssignmentPicker from './GroupAssignmentPicker.svelte';
	import AddItemModal from './AddItemModal.svelte';
	import PinnedTotalsBar from './PinnedTotalsBar.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';
	import PlusIcon from '$lib/icons/PlusIcon.svelte';
	import MinusIcon from '$lib/icons/MinusIcon.svelte';

	let expandedItemId = $state<string | null>(null);
	let bulkPanelOpen = $state(false);
	let bulkAssignment = $state<Map<string, number>>(new Map());
	let editingPriceId = $state<string | null>(null);
	let priceDraft = $state('');
	let addModalOpen = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	function toggleExpanded(itemId: string) {
		expandedItemId = expandedItemId === itemId ? null : itemId;
	}

	function toggleBulkPanel() {
		bulkPanelOpen = !bulkPanelOpen;
		if (bulkPanelOpen) bulkAssignment = new Map();
	}

	function applyBulk() {
		applyAssignmentToAllItems(bulkAssignment);
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

	function itemShares(units: { assignment: Map<string, number> }[]): { id: string; weight: number }[] {
		const aggregate = aggregateItemAssignment(units);
		return $participants
			.map((p) => ({ id: p.id, weight: aggregate.get(p.id) ?? 0 }))
			.filter((s) => s.weight > 0);
	}

	function colorOf(id: string): string {
		return $participantColors.get(id) ?? 'var(--color-text-muted)';
	}

	function tintOf(id: string): string {
		return `color-mix(in srgb, ${colorOf(id)} 12%, transparent)`;
	}

	let pinnedPills = $derived(
		$participants.map((p) => ({
			id: p.id,
			label: p.name,
			amountText: formatCents($groupTotals.totals.get(p.id) ?? 0, $currency, $locale),
			color: $participantColors.get(p.id)
		}))
	);

	let unassignedPill = $derived(
		$groupTotals.unassignedTotalCents > 0
			? {
					id: 'unassigned',
					label: $t('unassignedLabel'),
					amountText: formatCents($groupTotals.unassignedTotalCents, $currency, $locale)
				}
			: undefined
	);
</script>

<div class="card">
	<div class="toolbar">
		<button type="button" onclick={toggleBulkPanel}>{$t('bulkApply')}</button>
	</div>

	{#if bulkPanelOpen}
		<div class="bulk-panel">
			<GroupAssignmentPicker assignment={bulkAssignment} onchange={(next) => (bulkAssignment = next)} />
			<button type="button" onclick={applyBulk}>{$t('bulkApplyButton')}</button>
		</div>
	{/if}

	<ul class="item-list">
		{#each $groupItems as item (item.id)}
			{@const shares = itemShares(item.units)}
			{@const isMulti = shares.length > 1}
			{@const rowColor = shares.length === 1 ? colorOf(shares[0].id) : undefined}
			{@const gradientBar = isMulti ? buildRowGradient(shares, colorOf, 'to bottom') : undefined}
			{@const gradientBg = isMulti ? buildRowGradient(shares, tintOf, 'to right', true) : undefined}
			<li
				class="item-row"
				class:is-unassigned={shares.length === 0}
				class:is-multi-assigned={isMulti}
				style:--row-color={rowColor}
				style:--row-gradient-bar={gradientBar}
				style:--row-gradient-bg={gradientBg}
			>
				<div class="row-main">
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
						<GroupAssignmentPicker
							assignment={item.units[0].assignment}
							onchange={(next) => setItemAssignment(item.id, next)}
						/>
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
							<div class="unit-row">
								<span class="unit-label">{$t('unitLabel')} {i + 1}</span>
								<GroupAssignmentPicker
									assignment={unit.assignment}
									onchange={(next) => setUnitAssignment(item.id, i, next)}
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

<button
	class="add-item-trigger"
	type="button"
	aria-label={$t('addItem')}
	title={$t('addItem')}
	onclick={() => (addModalOpen = true)}
>
	<AddIcon size={20} />
</button>

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
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.bulk-panel {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
	}

	.item-list {
		list-style: none;
		margin: 1.5rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.item-row {
		position: relative;
		padding: 0.6rem 0.6rem 0.6rem calc(0.6rem + 4px);
		background: color-mix(in srgb, var(--row-color, var(--color-text-on-surface)) 10%, transparent);
		border-bottom: 1px solid color-mix(in srgb, var(--color-text-on-surface) 10%, transparent);
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	/*
	 * The color strip is always this ::before (never a border-left) so its
	 * position is identical in both the flat and gradient cases. A
	 * border-left's box is inset by the element's own padding box, which is
	 * NOT where an absolutely-positioned child's `left: 0` lands (that's the
	 * padding edge) — mixing the two, as an earlier version did, put the
	 * gradient strip a few pixels to the right of the flat-color strip.
	 */
	.item-row::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: var(--row-color, transparent);
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
	}

	.item-row.is-multi-assigned {
		background: var(--row-gradient-bg, transparent);
	}

	.item-row.is-multi-assigned::before {
		background: var(--row-gradient-bar);
	}

	.row-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
	}

	.row-fields {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.row-trail {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
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

	.add-item-trigger {
		position: fixed;
		right: 1.5rem;
		bottom: 5.5rem;
		width: 3.2rem;
		height: 3.2rem;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: #1a1a1a;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 21;
	}
</style>
