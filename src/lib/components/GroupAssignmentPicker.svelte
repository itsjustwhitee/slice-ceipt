<!-- src/lib/components/GroupAssignmentPicker.svelte -->
<script lang="ts">
	import { participants, participantColors } from '$lib/stores/participants';
	import { t } from '$lib/i18n';
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

	function adjustWeight(participantId: string, delta: number) {
		const current = assignment.get(participantId) ?? 1;
		const next = new Map(assignment);
		next.set(participantId, Math.max(1, current + delta));
		onchange(next);
	}

	let showCustomShare = $derived(assignment.size > 1);

	$effect(() => {
		if (!showCustomShare) sharePanelOpen = false;
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
	{#if showCustomShare}
		<button
			type="button"
			class="icon-button gear-toggle"
			class:is-active={sharePanelOpen}
			aria-label={$t('customShare')}
			title={$t('customShare')}
			onclick={() => (sharePanelOpen = !sharePanelOpen)}
		>
			<GearIcon size={14} />
		</button>
	{/if}
</div>

{#if showCustomShare && sharePanelOpen}
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
						<span>{weight}</span>
						<button type="button" onclick={() => adjustWeight(participant.id, 1)}>+</button>
					</div>
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

	.weight-stepper span {
		min-width: 1.5ch;
		text-align: center;
		font-weight: 700;
	}
</style>
