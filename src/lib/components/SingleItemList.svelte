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
	import SingleFractionPicker from './SingleFractionPicker.svelte';
	import AddIcon from '$lib/icons/AddIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';

	let expandedItemId = $state<string | null>(null);
	let bulkPanelOpen = $state(false);
	let bulkFraction = $state<Fraction | null>(null);

	let newItemName = $state('');
	let newItemPrice = $state('');
	let newItemQuantity = $state('1');

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

	function sameFraction(a: Fraction | null, b: Fraction | null): boolean {
		if (a === null || b === null) return a === b;
		return a.num === b.num && a.den === b.den;
	}

	function summarizeFraction(units: { fraction: Fraction | null }[]): string {
		const first = units[0].fraction;
		const allSame = units.every((u) => sameFraction(u.fraction, first));
		if (!allSame) return $t('mixedShare');
		if (first === null) return '';
		if (first.num === 1 && first.den === 1) return '';
		return first.den === 100 ? `${first.num}%` : `${first.num}/${first.den}`;
	}

	function toggleInclude(itemId: string, currentlyIncluded: boolean) {
		setItemFraction(itemId, currentlyIncluded ? null : { num: 1, den: 1 });
	}
</script>

<div class="card">
	<div class="toolbar">
		<button type="button" onclick={toggleBulkPanel}>{$t('bulkApply')}</button>
		<p class="your-total">{$t('yourTotal')}: {formatCents($singleTotal, $currency, $locale)}</p>
	</div>

	{#if bulkPanelOpen}
		<div class="bulk-panel">
			<SingleFractionPicker fraction={bulkFraction} onchange={(next) => (bulkFraction = next)} />
			<button type="button" onclick={applyBulk}>{$t('bulkApplyButton')}</button>
		</div>
	{/if}

	<ul class="item-list">
		{#each $singleItems as item (item.id)}
			{@const included = item.units[0].fraction !== null}
			{@const summary = summarizeFraction(item.units)}
			<li class="item-row" class:is-unassigned={!included}>
				<div class="row-main">
					{#if item.quantity > 1}
						<button
							type="button"
							class="chevron"
							class:is-expanded={expandedItemId === item.id}
							aria-label={expandedItemId === item.id ? $t('collapse') : $t('expand')}
							title={expandedItemId === item.id ? $t('collapse') : $t('expand')}
							onclick={() => toggleExpanded(item.id)}
						>
							▸
						</button>
					{:else}
						<span class="chevron-spacer"></span>
					{/if}
					<input
						type="checkbox"
						class="include-checkbox"
						aria-label={$t('nonMio')}
						checked={included}
						onclick={() => toggleInclude(item.id, included)}
					/>
					<input
						class="item-name"
						type="text"
						value={item.name}
						onchange={(e) => updateItemName(item.id, (e.target as HTMLInputElement).value)}
					/>
					<span class="item-qty">×</span>
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
					<SingleFractionPicker
						fraction={item.units[0].fraction}
						onchange={(next) => setItemFraction(item.id, next)}
					/>
					{#if summary}<span class="fraction-display">{summary}</span>{/if}
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

	.your-total {
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
		gap: 0.4rem;
	}

	.item-row {
		border-radius: 10px;
		padding: 0.5rem 0.6rem;
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
		border-left: 3px solid var(--color-accent);
		transition: background-color 0.15s ease, border-color 0.15s ease;
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
		flex-wrap: wrap;
		font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
	}

	.chevron {
		width: 1.5rem;
		flex: none;
		padding: 0.2em;
		border: none;
		background: transparent;
		transition: transform 0.15s ease;
	}

	.chevron.is-expanded {
		transform: rotate(90deg);
	}

	.chevron-spacer {
		width: 1.5rem;
		flex: none;
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

	.item-qty {
		opacity: 0.6;
	}

	.item-quantity {
		width: 2.5ch;
	}

	.item-price {
		width: 6ch;
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

	.add-item-form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 1rem;
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
