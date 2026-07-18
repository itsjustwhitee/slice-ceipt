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

	function applyCustom() {
		const parsed = parseFractionInput(customInput);
		if (parsed) onchange(parsed);
	}

	let quickDenominators = $derived(
		Array.from({ length: Math.max(0, $singleModeCount - 1) }, (_, i) => i + 2)
	);
</script>

<div class="fraction-picker">
	<button type="button" class:is-selected={fraction === null} onclick={() => onchange(null)}>
		{$t('nonMio')}
	</button>
	{#each quickDenominators as den (den)}
		<button type="button" class:is-selected={isQuickFraction(den)} onclick={() => onchange({ num: 1, den })}>
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
		<button type="submit">{$t('applyShare')}</button>
	</form>
</div>

<style>
	.fraction-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.custom-form {
		display: flex;
		gap: 0.4rem;
	}

	.custom-form input {
		font: inherit;
		width: 8ch;
		padding: 0.4em 0.6em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
	}
</style>
