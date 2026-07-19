<script lang="ts">
	interface Pill {
		id: string;
		label: string;
		amountText: string;
		color?: string;
	}
	interface Props {
		pills: Pill[];
	}
	let { pills }: Props = $props();
</script>

<div class="pinned-bar">
	<div class="pills">
		{#each pills as pill (pill.id)}
			<div class="pill" style:--pill-color={pill.color ?? 'var(--color-accent)'}>
				<span class="pill-label">{pill.label}</span>
				<span class="pill-amount">{pill.amountText}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.pinned-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		padding: 0 1.5rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
		pointer-events: none;
		z-index: 20;
	}

	.pills {
		pointer-events: auto;
		display: flex;
		gap: 0.5rem;
		max-width: 640px;
		width: 100%;
		overflow-x: auto;
		padding: 0.6rem 0.75rem;
		border-radius: 999px;
		background: var(--color-surface);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
	}

	.pill {
		flex: none;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		padding: 0.3em 0.9em;
		border-radius: 999px;
		border: 2px solid var(--pill-color);
		color: var(--color-text-on-surface);
		font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
		font-weight: 700;
		white-space: nowrap;
	}

	.pill-label {
		color: var(--pill-color);
		font-size: 0.85rem;
		font-weight: 600;
	}
</style>
