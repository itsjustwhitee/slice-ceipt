<!-- src/lib/components/InstallInfoModal.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		onclose: () => void;
	}
	let { open, onclose }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onclose}>
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="card modal"
			role="dialog"
			aria-modal="true"
			aria-label={$t('installModalTitle')}
			onclick={(e) => e.stopPropagation()}
		>
			<h2>{$t('installModalTitle')}</h2>
			<p>{$t('installIntro')}</p>
			<ul class="install-steps">
				<li>{$t('installStepAndroid')}</li>
				<li>{$t('installStepIos')}</li>
				<li>{$t('installStepDesktop')}</li>
			</ul>
			<button type="button" class="is-active" onclick={onclose}>{$t('close')}</button>
		</div>
	</div>
{/if}

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
		max-width: 26rem;
	}

	.modal h2 {
		margin: 0 0 0.75rem;
	}

	.modal p {
		margin: 0 0 1rem;
	}

	.install-steps {
		margin: 0 0 1.25rem;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.modal button {
		width: 100%;
	}
</style>
