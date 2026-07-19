<script lang="ts">
	interface Pill {
		id: string;
		label: string;
		amountText: string;
		color?: string;
	}
	interface Props {
		pills: Pill[];
		/** Always visible, never part of the scrollable region — e.g. the unassigned total. */
		trailingPill?: Pill;
	}
	let { pills, trailingPill }: Props = $props();
</script>

<div class="pinned-bar">
	<div class="card pills">
		<div class="pills-scroll">
			{#each pills as pill (pill.id)}
				<div class="pill" style:--pill-color={pill.color ?? 'var(--color-accent)'}>
					<span class="pill-label">{pill.label}</span>
					<span class="pill-amount">{pill.amountText}</span>
				</div>
			{/each}
		</div>
		{#if trailingPill}
			<div class="pill is-danger">
				<span class="pill-label">{trailingPill.label}</span>
				<span class="pill-amount">{trailingPill.amountText}</span>
			</div>
		{/if}
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
		align-items: center;
		gap: 0.5rem;
		width: auto;
		max-width: 100%;
		padding: 0.6rem 0.75rem;
		border-radius: 999px;
	}

	.pills-scroll {
		display: flex;
		gap: 0.5rem;
		flex: 1 1 auto;
		min-width: 0;
		overflow-x: auto;
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
		font-family: var(--font-mono);
		font-weight: 700;
		white-space: nowrap;
	}

	.pill-label {
		color: var(--pill-color);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.pill.is-danger {
		margin-left: auto;
		background: var(--color-error);
		border-color: var(--color-error);
		color: #fff;
	}

	.pill.is-danger .pill-label {
		color: #ffe5e0;
	}
</style>
