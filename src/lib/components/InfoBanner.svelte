<!-- src/lib/components/InfoBanner.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import CloseIcon from '$lib/icons/CloseIcon.svelte';

	interface Props {
		text: string;
	}
	let { text }: Props = $props();
	let visible = $state(true);
</script>

{#if visible}
	<div class="info-banner" role="status">
		<p>{text}</p>
		<button type="button" class="dismiss" aria-label={$t('close')} onclick={() => (visible = false)}>
			<CloseIcon size={14} />
		</button>
	</div>
{/if}

<style>
	.info-banner {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 0.6rem);
		left: 0;
		right: 0;
		z-index: 45;
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		max-width: 34rem;
		margin: 0 auto;
		padding: 0.75rem 0.85rem;
		border-radius: 12px;
		background: var(--color-surface);
		color: var(--color-text-on-surface);
		border: 2px solid color-mix(in srgb, var(--color-warning) 65%, transparent);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
		font-size: 0.9rem;
	}

	.info-banner p {
		margin: 0;
		flex: 1;
	}

	.dismiss {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.6rem;
		height: 1.6rem;
		padding: 0;
		border: none;
		background: transparent;
		opacity: 0.7;
	}

	.dismiss:hover {
		opacity: 1;
	}

	@media (max-width: 36rem) {
		.info-banner {
			left: 1rem;
			right: 1rem;
			max-width: none;
		}
	}
</style>
