<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { step, mode, resetSession } from '$lib/stores/receipt';
	import Uploader from '$lib/components/Uploader.svelte';
	import SetupStep from '$lib/components/SetupStep.svelte';
	import GroupItemList from '$lib/components/GroupItemList.svelte';
	import SingleItemList from '$lib/components/SingleItemList.svelte';
	import GroupSummary from '$lib/components/GroupSummary.svelte';
	import SingleSummary from '$lib/components/SingleSummary.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Logo from '$lib/icons/Logo.svelte';
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
			<span class="wordmark">SliceCeipt</span>
		</button>
		<div class="lang-switch">
			<button class:is-active={$locale === 'en'} onclick={() => locale.set('en')}>EN</button>
			<button class:is-active={$locale === 'it'} onclick={() => locale.set('it')}>IT</button>
		</div>
	</div>

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

	.lang-switch {
		display: flex;
		gap: 0.5rem;
	}
</style>
