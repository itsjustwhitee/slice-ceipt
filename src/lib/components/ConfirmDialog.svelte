<!-- src/lib/components/ConfirmDialog.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		message: string;
		onconfirm: () => void;
		oncancel: () => void;
	}
	let { open, message, onconfirm, oncancel }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') oncancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={oncancel}>
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="card modal" role="dialog" aria-modal="true" aria-label={message} onclick={(e) => e.stopPropagation()}>
			<p>{message}</p>
			<div class="modal-actions">
				<button type="button" onclick={oncancel}>{$t('cancel')}</button>
				<button type="button" class="confirm-danger" onclick={onconfirm}>{$t('deleteItem')}</button>
			</div>
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
		max-width: 22rem;
	}

	.modal p {
		margin: 0 0 1.25rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
	}

	.modal-actions button {
		flex: 1;
	}

	.confirm-danger {
		background: var(--color-error);
		border-color: var(--color-error);
		color: #fff;
	}

	.confirm-danger:hover {
		background: color-mix(in srgb, var(--color-error) 80%, black);
		border-color: color-mix(in srgb, var(--color-error) 80%, black);
		color: #fff;
	}
</style>
