<!-- src/lib/components/GroupItemList.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { groupItems, groupTotals, step } from '$lib/stores/receipt';
	import { participants } from '$lib/stores/participants';
	import { participantColors } from '$lib/stores/participants';
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
	import GroupAssignmentPicker from './GroupAssignmentPicker.svelte';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';

	let expandedItemId = $state<string | null>(null);
	let bulkPanelOpen = $state(false);
	let bulkAssignment = $state<Map<string, number>>(new Map());

	let newItemName = $state('');
	let newItemPrice = $state('');
	let newItemQuantity = $state('1');

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

	function submitAddItem() {
		const name = newItemName.trim();
		const priceCents = Math.round(Number(newItemPrice) * 100);
		const quantity = Math.round(Number(newItemQuantity));
		if (!name || !Number.isFinite(priceCents) || priceCents <= 0 || !Number.isFinite(quantity) || quantity < 1)
			return;
		addItem(name, priceCents, quantity);
		newItemName = '';
		newItemPrice = '';
		newItemQuantity = '1';
	}

	function assignedParticipantIds(units: { assignment: Map<string, number> }[]): string[] {
		const ids = new Set<string>();
		for (const unit of units) for (const id of unit.assignment.keys()) ids.add(id);
		return [...ids];
	}
</script>

<div class="card">
	<div class="toolbar">
		<button type="button" onclick={toggleBulkPanel}>{$t('bulkApply')}</button>
		<p class="unassigned-total">
			{$t('unassignedLabel')}: {formatCents($groupTotals.unassignedTotalCents, $currency, $locale)}
		</p>
	</div>

	{#if bulkPanelOpen}
		<div class="bulk-panel">
			<GroupAssignmentPicker assignment={bulkAssignment} onchange={(next) => (bulkAssignment = next)} />
			<button type="button" onclick={applyBulk}>{$t('bulkApplyButton')}</button>
		</div>
	{/if}

	<ul class="item-list">
		{#each $groupItems as item (item.id)}
			{@const assignedIds = assignedParticipantIds(item.units)}
			<li class="item-row">
				<div class="item-summary">
					<input
						class="item-name"
						type="text"
						value={item.name}
						onchange={(e) => updateItemName(item.id, (e.target as HTMLInputElement).value)}
					/>
					<input
						class="item-quantity"
						type="number"
						min="1"
						value={item.quantity}
						onchange={(e) => handleQuantityChange(item.id, (e.target as HTMLInputElement).value)}
					/>
					<input
						class="item-price"
						type="number"
						min="0"
						step="0.01"
						value={(item.unitPriceCents / 100).toFixed(2)}
						onchange={(e) => handlePriceChange(item.id, (e.target as HTMLInputElement).value)}
					/>
					<button
						type="button"
						class="expand-toggle"
						class:is-expanded={expandedItemId === item.id}
						aria-label={expandedItemId === item.id ? $t('collapse') : $t('expand')}
						title={expandedItemId === item.id ? $t('collapse') : $t('expand')}
						onclick={() => toggleExpanded(item.id)}
					>
						▾
					</button>
					<button
						type="button"
						class="icon-button is-danger"
						aria-label={$t('deleteItem')}
						title={$t('deleteItem')}
						onclick={() => deleteItem(item.id)}
					>
						<BinIcon size={16} />
					</button>
				</div>

				{#if assignedIds.length === 0}
					<p class="unassigned-badge">{$t('unassignedLabel')}</p>
				{:else}
					<div class="assigned-chips">
						{#each assignedIds as id (id)}
							{@const p = $participants.find((x) => x.id === id)}
							{#if p}
								<span class="mini-chip" style:--chip-color={$participantColors.get(id)}>{p.name}</span>
							{/if}
						{/each}
					</div>
				{/if}

				{#if expandedItemId === item.id}
					<div class="expanded-panel">
						<p class="panel-label">{$t('assignWholeItem')}</p>
						<GroupAssignmentPicker
							assignment={item.units[0].assignment}
							onchange={(next) => setItemAssignment(item.id, next)}
						/>
						{#if item.quantity > 1}
							{#each item.units as unit, i (i)}
								<p class="panel-label">{$t('unitLabel')} {i + 1}</p>
								<GroupAssignmentPicker
									assignment={unit.assignment}
									onchange={(next) => setUnitAssignment(item.id, i, next)}
								/>
							{/each}
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<form
		class="add-item-form"
		onsubmit={(e) => {
			e.preventDefault();
			submitAddItem();
		}}
	>
		<input type="text" placeholder={$t('itemNamePlaceholder')} bind:value={newItemName} />
		<input type="number" min="0" step="0.01" placeholder={$t('priceLabel')} bind:value={newItemPrice} />
		<input type="number" min="1" placeholder={$t('quantityLabel')} bind:value={newItemQuantity} />
		<button class="icon-button" type="submit" aria-label={$t('addItem')} title={$t('addItem')}>
			<AddIcon size={16} />
		</button>
	</form>

	<button class="continue" type="button" onclick={() => step.set('summary')}>{$t('itemsContinue')}</button>
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.unassigned-total {
		font-weight: 600;
		opacity: 0.85;
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
		gap: 0.75rem;
	}

	.item-row {
		border-radius: 12px;
		padding: 0.75rem;
		background: color-mix(in srgb, var(--color-text-on-surface) 4%, transparent);
	}

	.item-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.item-name {
		flex: 1;
		min-width: 8ch;
	}

	.item-quantity {
		width: 4ch;
	}

	.item-price {
		width: 7ch;
	}

	.item-name,
	.item-quantity,
	.item-price {
		font: inherit;
		padding: 0.4em 0.6em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
	}

	.expand-toggle {
		transition: transform 0.15s ease;
	}

	.expand-toggle.is-expanded {
		transform: rotate(180deg);
	}

	.unassigned-badge {
		margin: 0.5rem 0 0;
		color: var(--color-error);
		font-weight: 600;
		font-size: 0.9rem;
	}

	.assigned-chips {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.mini-chip {
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.15em 0.7em;
		border-radius: 999px;
		background: var(--chip-color);
		color: #1a1a1a;
	}

	.expanded-panel {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid color-mix(in srgb, var(--color-text-on-surface) 15%, transparent);
	}

	.panel-label {
		font-weight: 600;
		font-size: 0.85rem;
		opacity: 0.75;
		margin: 0.75rem 0 0.4rem;
	}

	.add-item-form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.add-item-form input {
		font: inherit;
		padding: 0.5em 0.75em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
	}

	.continue {
		margin-top: 1.5rem;
		width: 100%;
	}
</style>
