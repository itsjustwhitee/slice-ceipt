<!-- src/lib/components/GroupSummary.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { currency } from '$lib/stores/currency';
	import { participants, participantColors } from '$lib/stores/participants';
	import { groupItems, groupTotals, resetSession, step } from '$lib/stores/receipt';
	import { computeGroupItemization } from '$lib/session';
	import { formatCents } from '$lib/money';
	import { formatGroupSummaryText } from '$lib/format-summary';
	import ShareBar from './ShareBar.svelte';
	import BackIcon from '$lib/icons/BackIcon.svelte';
	import NewReceiptIcon from '$lib/icons/NewReceiptIcon.svelte';

	let people = $derived(
		$participants.map((p) => ({
			id: p.id,
			name: p.name,
			totalCents: $groupTotals.totals.get(p.id) ?? 0,
			items: computeGroupItemization(
				$groupItems,
				p.id,
				$participants.map((x) => x.id)
			)
		}))
	);

	let summaryText = $derived(
		formatGroupSummaryText(
			people.map((p) => ({ name: p.name, totalCents: p.totalCents, items: p.items })),
			$currency,
			$locale
		)
	);
</script>

<div class="card">
	<h1>{$t('summaryTitle')}</h1>

	{#if $groupTotals.unassignedTotalCents > 0}
		<p class="unassigned-note">
			{$t('unassignedLabel')}: {formatCents($groupTotals.unassignedTotalCents, $currency, $locale)}
		</p>
	{/if}

	<ul class="person-list">
		{#each people as person (person.id)}
			<li class="person-card">
				<div class="person-header">
					<span class="person-name" style:--chip-color={$participantColors.get(person.id)}>
						{person.name}
					</span>
					<span class="person-total">{formatCents(person.totalCents, $currency, $locale)}</span>
				</div>
				{#if person.items.length > 0}
					<ul class="item-breakdown">
						{#each person.items as item}
							<li>
								<span>{item.name}</span>
								<span>{formatCents(item.shareCents, $currency, $locale)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>

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
	.unassigned-note {
		color: var(--color-error);
		font-weight: 600;
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
		border-left: 4px solid var(--chip-color);
	}

	.person-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--font-mono);
	}

	.person-name {
		font-weight: 700;
		color: var(--chip-color);
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
