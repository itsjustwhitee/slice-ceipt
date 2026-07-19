<!-- src/lib/components/ToastHost.svelte -->
<script lang="ts">
	import { toasts } from '$lib/stores/toast';
</script>

<div class="toast-host">
	{#each $toasts as toast (toast.id)}
		<div class="toast" class:is-success={toast.variant === 'success'} class:is-danger={toast.variant === 'danger'}>
			{toast.text}
		</div>
	{/each}
</div>

<style>
	.toast-host {
		position: fixed;
		top: 4.5rem;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		z-index: 50;
		pointer-events: none;
		padding: 0 1rem;
	}

	.toast {
		pointer-events: auto;
		padding: 0.6em 1.2em;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.9rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		background: var(--color-surface);
		color: var(--color-text-on-surface);
		border: 2px solid var(--color-accent);
		max-width: 90vw;
		text-align: center;
	}

	.toast.is-success {
		border-color: #2ecc71;
	}

	.toast.is-danger {
		background: var(--color-error);
		border-color: var(--color-error);
		color: #fff;
	}
</style>
