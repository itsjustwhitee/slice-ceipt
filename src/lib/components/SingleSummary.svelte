<!-- src/lib/components/SingleSummary.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { singleItems, singleTotal, resetSession } from '$lib/stores/receipt';
	import { computeSingleItemization } from '$lib/session';
	import { formatCents } from '$lib/money';
	import { formatSingleSummaryText } from '$lib/format-summary';
	import ShareBar from './ShareBar.svelte';
	import CopyIcon from '$lib/icons/CopyIcon.svelte';
	import NewReceiptIcon from '$lib/icons/NewReceiptIcon.svelte';

	let items = $derived(computeSingleItemization($singleItems));
	let summaryText = $derived(formatSingleSummaryText($singleTotal, items, $currency, $locale));

	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(summaryText);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="card">
	<div class="summary-header">
		<h1>{$t('summaryTitle')}</h1>
		<div class="header-actions">
			<button
				class="icon-button copy-trigger"
				type="button"
				aria-label={copied ? $t('copied') : $t('copySummary')}
				title={copied ? $t('copied') : $t('copySummary')}
				onclick={copy}
			>
				<CopyIcon size={16} />
			</button>
			<ShareBar text={summaryText} />
		</div>
	</div>

	<ul class="person-list">
		<li class="person-card">
			<div class="person-header">
				<span class="person-name">{$t('yourTotal')}</span>
				<span class="person-total">{formatCents($singleTotal, $currency, $locale)}</span>
			</div>
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
		</li>
	</ul>

	<div class="summary-actions">
		<button class="start-over" type="button" onclick={resetSession}>
			<NewReceiptIcon size={18} />
			{$t('startOver')}
		</button>
	</div>
</div>

<style>
	.summary-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.summary-header h1 {
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.person-list {
		list-style: none;
		margin: 1.5rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.person-card {
		border-radius: 12px;
		padding: 0.75rem;
		background: color-mix(in srgb, var(--color-text-on-surface) 4%, transparent);
		border-left: 4px solid var(--color-accent);
	}

	.person-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--font-mono);
	}

	.person-name {
		font-weight: 700;
		color: var(--color-accent);
	}

	.person-total {
		font-weight: 700;
	}

	.item-breakdown {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-family: var(--font-mono);
	}

	.item-breakdown li {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		opacity: 0.85;
	}

	.summary-actions {
		margin-top: 1.5rem;
	}

	.start-over {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
	}
</style>
