<!-- src/lib/components/ShareBar.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		text: string;
	}
	let { text }: Props = $props();

	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function share() {
		try {
			await navigator.share({ text });
		} catch {
			// User cancelled the share sheet, or the browser rejected the call — nothing to show for either.
		}
	}
</script>

<div class="share-bar">
	<button type="button" onclick={copy}>{copied ? $t('copied') : $t('copySummary')}</button>
	{#if browser && 'share' in navigator}
		<button type="button" onclick={share}>{$t('shareSummary')}</button>
	{/if}
</div>

<style>
	.share-bar {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
		flex-wrap: wrap;
	}
</style>
