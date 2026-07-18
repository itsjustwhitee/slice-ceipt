<!-- src/lib/components/GroupAssignmentPicker.svelte -->
<script lang="ts">
	import { participants, participantColors } from '$lib/stores/participants';

	interface Props {
		assignment: Map<string, number>;
		onchange: (assignment: Map<string, number>) => void;
	}
	let { assignment, onchange }: Props = $props();

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

	let showStepper = $derived(assignment.size > 1);
</script>

<div class="assignment-picker">
	{#each $participants as participant (participant.id)}
		{@const weight = assignment.get(participant.id)}
		<div class="picker-entry">
			<button
				type="button"
				class="chip"
				class:is-selected={weight !== undefined}
				style:--chip-color={$participantColors.get(participant.id)}
				onclick={() => toggle(participant.id)}
			>
				{participant.name}
			</button>
			{#if weight !== undefined && showStepper}
				<div class="weight-stepper">
					<button type="button" onclick={() => adjustWeight(participant.id, -1)}>−</button>
					<span>{weight}</span>
					<button type="button" onclick={() => adjustWeight(participant.id, 1)}>+</button>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.assignment-picker {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.picker-entry {
		display: flex;
		align-items: center;
		gap: 0.3rem;
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
