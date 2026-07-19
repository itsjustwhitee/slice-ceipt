<!-- src/lib/components/ShareBar.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';
	import ShareIcon from '$lib/icons/ShareIcon.svelte';

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
	<button
		type="button"
		class="icon-button"
		aria-label={$t('shareSummary')}
		title={$t('shareSummary')}
		onclick={share}
	>
		<ShareIcon size={16} />
	</button>
{/if}
