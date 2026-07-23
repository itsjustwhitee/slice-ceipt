<script lang="ts">
	import { t } from '$lib/i18n';
	import { parseNewItemInput, type NewItemInput } from '$lib/new-item-input';

	interface Props {
		open: boolean;
		onadd: (input: { name: string; unitPriceCents: number; quantity: number }) => void;
		onclose: () => void;
	}
	let { open, onadd, onclose }: Props = $props();

	let name = $state('');
	let price = $state('');
	let quantity = $state('1');
	let pendingNegativeItem = $state<NewItemInput | null>(null);

	$effect(() => {
		if (open) {
			name = '';
			price = '';
			quantity = '1';
			pendingNegativeItem = null;
		}
	});

	function submit() {
		const parsed = parseNewItemInput(name, price, quantity);
		if (!parsed) return;
		if (parsed.unitPriceCents < 0) {
			pendingNegativeItem = parsed;
			return;
		}
		onadd(parsed);
	}

	function confirmNegative() {
		if (!pendingNegativeItem) return;
		onadd(pendingNegativeItem);
		pendingNegativeItem = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			if (pendingNegativeItem) {
				pendingNegativeItem = null;
			} else {
				onclose();
			}
		}
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
			aria-label={$t('addItem')}
			onclick={(e) => e.stopPropagation()}
		>
			{#if pendingNegativeItem}
				<h2>{$t('confirmNegativePriceTitle')}</h2>
				<p>{$t('confirmNegativePriceBody').replace('{name}', pendingNegativeItem.name)}</p>
				<div class="modal-actions">
					<button type="button" onclick={() => (pendingNegativeItem = null)}>{$t('cancel')}</button>
					<button type="button" class="is-active" onclick={confirmNegative}>{$t('addItem')}</button>
				</div>
			{:else}
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
					<input type="number" step="0.01" placeholder={$t('priceLabel')} bind:value={price} />
					<input type="number" min="1" placeholder={$t('quantityLabel')} bind:value={quantity} />
					<div class="modal-actions">
						<button type="button" onclick={onclose}>{$t('cancel')}</button>
						<button type="submit" class="is-active">{$t('addItem')}</button>
					</div>
				</form>
			{/if}
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

	.modal h2 {
		margin: 0 0 1rem;
	}

	.modal p {
		margin: 0 0 1.25rem;
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
