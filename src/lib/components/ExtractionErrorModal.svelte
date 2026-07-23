<!-- src/lib/components/ExtractionErrorModal.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import SkipIcon from '$lib/icons/SkipIcon.svelte';

	interface Props {
		onretry: () => void;
		onskip: () => void;
	}
	let { onretry, onskip }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onskip();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onskip}>
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="card modal"
		role="alertdialog"
		aria-modal="true"
		aria-label={$t('extractionErrorTitle')}
		onclick={(e) => e.stopPropagation()}
	>
		<p class="modal-title">{$t('extractionErrorTitle')}</p>
		<div class="modal-actions">
			<button type="button" onclick={onretry}>{$t('extractionRetry')}</button>
			<button
				type="button"
				class="icon-button"
				aria-label={$t('extractionContinueManually')}
				title={$t('extractionContinueManually')}
				onclick={onskip}
			>
				<SkipIcon />
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 30;
	}

	.modal {
		padding: 1.5rem;
		width: 100%;
		max-width: 22rem;
	}

	.modal-title {
		margin: 0 0 1.25rem;
		font-weight: 600;
		color: var(--color-error);
	}

	.modal-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.modal-actions button:first-child {
		flex: 1;
	}
</style>
