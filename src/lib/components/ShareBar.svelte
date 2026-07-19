<!-- src/lib/components/ShareBar.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		text: string;
	}
	let { text }: Props = $props();

	async function share() {
		try {
			await navigator.share({ text });
		} catch {
			// User cancelled the share sheet, or the browser rejected the call — nothing to show for either.
		}
	}
</script>

{#if browser && 'share' in navigator}
	<div class="share-bar">
		<button type="button" onclick={share}>{$t('shareSummary')}</button>
	</div>
{/if}

<style>
	.share-bar {
		margin-top: 1.5rem;
	}
</style>
