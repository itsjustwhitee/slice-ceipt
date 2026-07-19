<!-- src/lib/components/SingleSummary.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { singleItems, singleTotal, resetSession, step } from '$lib/stores/receipt';
	import { computeSingleItemization } from '$lib/session';
	import { formatCents } from '$lib/money';
	import { formatSingleSummaryText } from '$lib/format-summary';
	import ShareBar from './ShareBar.svelte';
	import BackIcon from '$lib/icons/BackIcon.svelte';
	import NewReceiptIcon from '$lib/icons/NewReceiptIcon.svelte';

	let items = $derived(computeSingleItemization($singleItems));
	let summaryText = $derived(formatSingleSummaryText($singleTotal, items, $currency, $locale));
</script>

<div class="card">
	<h1>{$t('summaryTitle')}</h1>
	<p class="your-total">{$t('yourTotal')}: {formatCents($singleTotal, $currency, $locale)}</p>

	{#if items.length > 0}
		<ul class="item-breakdown">
			{#each items as item}
				<li>
					<span>{item.name}</span>
					<span>{formatCents(item.shareCents, $currency, $locale)}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<ShareBar text={summaryText} />

	<div class="summary-actions">
		<button
			class="icon-button back-to-items"
			type="button"
			aria-label={$t('backToItems')}
			title={$t('backToItems')}
			onclick={() => step.set('items')}
		>
			<BackIcon size={18} />
		</button>
		<button
			class="icon-button start-over"
			type="button"
			aria-label={$t('startOver')}
			title={$t('startOver')}
			onclick={resetSession}
		>
			<NewReceiptIcon size={18} />
		</button>
	</div>
</div>

<style>
	.your-total {
		font-weight: 700;
		font-size: 1.1rem;
		font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
	}

	.item-breakdown {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
	}

	.item-breakdown li {
		display: flex;
		justify-content: space-between;
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		background: color-mix(in srgb, var(--color-text-on-surface) 4%, transparent);
	}

	.summary-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.summary-actions button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
