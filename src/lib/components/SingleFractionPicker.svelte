<!-- src/lib/components/SingleFractionPicker.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { singleModeCount } from '$lib/stores/receipt';
	import { parseFractionInput } from '$lib/parse-fraction-input';
	import type { Fraction } from '$lib/money';

	interface Props {
		fraction: Fraction | null;
		onchange: (fraction: Fraction | null) => void;
	}
	let { fraction, onchange }: Props = $props();

	let customInput = $state('');

	function isQuickFraction(den: number): boolean {
		return fraction !== null && fraction.num === 1 && fraction.den === den;
	}

	function toggleQuickFraction(den: number) {
		onchange(isQuickFraction(den) ? null : { num: 1, den });
	}

	function applyCustom() {
		const parsed = parseFractionInput(customInput);
		if (parsed) onchange(parsed);
	}

	let quickDenominators = $derived(
		Array.from({ length: Math.max(0, $singleModeCount - 1) }, (_, i) => i + 2)
	);
</script>

<div class="fraction-picker">
	{#each quickDenominators as den (den)}
		<button type="button" class:is-selected={isQuickFraction(den)} onclick={() => toggleQuickFraction(den)}>
			1/{den}
		</button>
	{/each}
	<form
		class="custom-form"
		onsubmit={(e) => {
			e.preventDefault();
			applyCustom();
		}}
	>
		<input type="text" placeholder={$t('customSharePlaceholder')} bind:value={customInput} />
	</form>
</div>

<style>
	.fraction-picker {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.fraction-picker button {
		font-size: 0.9rem;
		padding: 0.25em 0.85em;
	}

	.custom-form input {
		font: inherit;
		font-size: 0.9rem;
		width: 6ch;
		padding: 0.3em 0.5em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
		background: transparent;
		color: inherit;
	}

	.fraction-picker button.is-selected {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: #1a1a1a;
	}
</style>
