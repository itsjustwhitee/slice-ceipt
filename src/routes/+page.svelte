<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { step, mode, resetSession, goBack } from '$lib/stores/receipt';
	import Uploader from '$lib/components/Uploader.svelte';
	import SetupStep from '$lib/components/SetupStep.svelte';
	import GroupItemList from '$lib/components/GroupItemList.svelte';
	import SingleItemList from '$lib/components/SingleItemList.svelte';
	import GroupSummary from '$lib/components/GroupSummary.svelte';
	import SingleSummary from '$lib/components/SingleSummary.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import Logo from '$lib/icons/Logo.svelte';
	import BackIcon from '$lib/icons/BackIcon.svelte';
</script>

<main>
	<div class="top-bar">
		<button
			type="button"
			class="logo-button"
			aria-label={$t('startOver')}
			title={$t('startOver')}
			onclick={resetSession}
		>
			<Logo size={32} />
			<span class="wordmark">Slice<span class="wordmark-accent">Ceipt</span></span>
		</button>
		<div class="lang-switch">
			<button class:is-active={$locale === 'en'} onclick={() => locale.set('en')}>EN</button>
			<button class:is-active={$locale === 'it'} onclick={() => locale.set('it')}>IT</button>
		</div>
	</div>

	{#if $step !== 'upload'}
		<button type="button" class="floating-back" aria-label={$t('back')} title={$t('back')} onclick={goBack}>
			<BackIcon size={18} />
		</button>
	{/if}

	{#if $step === 'upload'}
		<Uploader />
	{:else if $step === 'setup'}
		<SetupStep />
	{:else if $step === 'items'}
		{#if $mode === 'group'}
			<GroupItemList />
		{:else}
			<SingleItemList />
		{/if}
	{:else if $mode === 'group'}
		<GroupSummary />
	{:else}
		<SingleSummary />
	{/if}

	<Footer />
</main>

<ToastHost />

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.logo-button,
	.logo-button:hover {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		border: none;
		background: transparent;
		padding: 0;
	}

	.wordmark {
		font-family: var(--font-wordmark);
		font-size: 1.35rem;
		color: var(--color-text);
	}

	.wordmark-accent {
		color: var(--color-accent);
	}

	.lang-switch {
		display: flex;
		gap: 0.5rem;
	}

	.floating-back {
		position: fixed;
		top: 6rem;
		left: 1rem;
		width: 2.6rem;
		height: 2.6rem;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-on-surface);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		z-index: 25;
	}

	.floating-back :global(svg) {
		flex-shrink: 0;
	}
</style>
