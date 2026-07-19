<!-- src/lib/components/GroupAssignmentPicker.svelte -->
<script lang="ts">
	import { participants, participantColors } from '$lib/stores/participants';
	import { t } from '$lib/i18n';
	import { weightPercentages } from '$lib/weight-share';
	import GearIcon from '$lib/icons/GearIcon.svelte';

	interface Props {
		assignment: Map<string, number>;
		onchange: (assignment: Map<string, number>) => void;
	}
	let { assignment, onchange }: Props = $props();

	let sharePanelOpen = $state(false);

	function toggle(participantId: string) {
		const next = new Map(assignment);
		if (next.has(participantId)) {
			next.delete(participantId);
		} else {
			next.set(participantId, 1);
		}
		onchange(next);
	}

	function setWeight(participantId: string, weight: number) {
		const safeWeight = Math.max(1, Math.round(weight));
		const next = new Map(assignment);
		next.set(participantId, safeWeight);
		onchange(next);
	}

	function adjustWeight(participantId: string, delta: number) {
		const current = assignment.get(participantId) ?? 1;
		setWeight(participantId, current + delta);
	}

	let canCustomize = $derived(assignment.size > 1);
	let percentages = $derived(weightPercentages(assignment));

	$effect(() => {
		if (!canCustomize) sharePanelOpen = false;
	});
</script>

<div class="assignment-picker">
	{#each $participants as participant (participant.id)}
		{@const weight = assignment.get(participant.id)}
		<button
			type="button"
			class="chip"
			class:is-selected={weight !== undefined}
			style:--chip-color={$participantColors.get(participant.id)}
			onclick={() => toggle(participant.id)}
		>
			{participant.name}
		</button>
	{/each}
	<button
		type="button"
		class="icon-button gear-toggle"
		class:is-active={sharePanelOpen}
		disabled={!canCustomize}
		aria-label={canCustomize ? $t('customShare') : $t('customShareNeedsTwo')}
		title={canCustomize ? $t('customShare') : $t('customShareNeedsTwo')}
		onclick={() => (sharePanelOpen = !sharePanelOpen)}
	>
		<GearIcon size={14} />
	</button>
</div>

{#if canCustomize && sharePanelOpen}
	<div class="share-panel">
		{#each $participants as participant (participant.id)}
			{@const weight = assignment.get(participant.id)}
			{#if weight !== undefined}
				<div class="share-row">
					<span class="share-name" style:--chip-color={$participantColors.get(participant.id)}>
						{participant.name}
					</span>
					<div class="weight-stepper">
						<button type="button" onclick={() => adjustWeight(participant.id, -1)}>−</button>
						<input
							type="number"
							min="1"
							class="weight-input"
							value={weight}
							onchange={(e) => setWeight(participant.id, Number((e.target as HTMLInputElement).value))}
						/>
						<button type="button" onclick={() => adjustWeight(participant.id, 1)}>+</button>
					</div>
					<span class="share-percent">{percentages.get(participant.id) ?? 0}%</span>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.assignment-picker {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.chip {
		border-radius: 999px;
		border: 2px solid var(--chip-color);
		color: var(--chip-color);
		background: transparent;
		padding: 0.25em 0.85em;
		font-size: 0.9rem;
	}

	.chip.is-selected {
		background: var(--chip-color);
		color: #1a1a1a;
	}

	.gear-toggle {
		padding: 0.35em;
		border-radius: 999px;
	}

	.gear-toggle:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.gear-toggle:disabled:hover {
		border-color: color-mix(in srgb, currentColor 25%, transparent);
	}

	.share-panel {
		flex-basis: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.4rem;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
	}

	.share-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.share-name {
		font-weight: 600;
		color: var(--chip-color);
	}

	.weight-stepper {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.weight-input {
		width: 3ch;
		text-align: center;
		font: inherit;
		font-weight: 700;
		padding: 0.2em 0;
		border-radius: 6px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
		background: transparent;
		color: inherit;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.weight-input::-webkit-inner-spin-button,
	.weight-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.share-percent {
		min-width: 3.5ch;
		text-align: right;
		font-size: 0.85rem;
		font-weight: 700;
		opacity: 0.75;
	}
</style>
