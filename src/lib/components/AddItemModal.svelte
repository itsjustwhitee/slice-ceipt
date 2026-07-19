<script lang="ts">
	import { t } from '$lib/i18n';
	import { parseNewItemInput } from '$lib/new-item-input';

	interface Props {
		open: boolean;
		onadd: (input: { name: string; unitPriceCents: number; quantity: number }) => void;
		onclose: () => void;
	}
	let { open, onadd, onclose }: Props = $props();

	let name = $state('');
	let price = $state('');
	let quantity = $state('1');

	$effect(() => {
		if (open) {
			name = '';
			price = '';
			quantity = '1';
		}
	});

	function submit() {
		const parsed = parseNewItemInput(name, price, quantity);
		if (!parsed) return;
		onadd(parsed);
	}

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
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-label={$t('addItem')}
			onclick={(e) => e.stopPropagation()}
		>
			<h2>{$t('addItem')}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					autofocus
					placeholder={$t('itemNamePlaceholder')}
					bind:value={name}
				/>
				<input type="number" min="0" step="0.01" placeholder={$t('priceLabel')} bind:value={price} />
				<input type="number" min="1" placeholder={$t('quantityLabel')} bind:value={quantity} />
				<div class="modal-actions">
					<button type="button" onclick={onclose}>{$t('cancel')}</button>
					<button type="submit" class="is-active">{$t('addItem')}</button>
				</div>
			</form>
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
		background: var(--color-surface);
		color: var(--color-text-on-surface);
		border-radius: 16px;
		padding: 1.5rem;
		width: 100%;
		max-width: 22rem;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	}

	.modal h2 {
		margin: 0 0 1rem;
	}

	.modal form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal input {
		font: inherit;
		padding: 0.6em 0.75em;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
		background: transparent;
		color: inherit;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.modal-actions button {
		flex: 1;
	}
</style>
