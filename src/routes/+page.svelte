<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import { step, mode, resetSession, goBack } from '$lib/stores/receipt';
	import Uploader from '$lib/components/Uploader.svelte';
	import SetupStep from '$lib/components/SetupStep.svelte';
	import GroupItemList from '$lib/components/GroupItemList.svelte';
	import SingleItemList from '$lib/components/SingleItemList.svelte';
	import GroupSummary from '$lib/components/GroupSummary.svelte';
	import SingleSummary from '$lib/components/SingleSummary.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import Logo from '$lib/icons/Logo.svelte';
	import BackIcon from '$lib/icons/BackIcon.svelte';
	import SunIcon from '$lib/icons/SunIcon.svelte';
	import MoonIcon from '$lib/icons/MoonIcon.svelte';

	function toggleTheme() {
		theme.update((current) => (current === 'light' ? 'dark' : 'light'));
	}

	// Starts matching SSR (detectInitialTheme always returns 'dark' server-side)
	// and is corrected in an $effect — see Logo.svelte for why a direct
	// `$theme === 'light'` conditional/attribute here would stay stuck on the
	// dark-theme icon and label after a reload with light theme saved.
	let isLight = $state(false);

	$effect(() => {
		isLight = $theme === 'light';
	});
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
		<div class="top-bar-controls">
			<button
				type="button"
				class="icon-button"
				aria-label={isLight ? $t('themeToggleToDark') : $t('themeToggleToLight')}
				title={isLight ? $t('themeToggleToDark') : $t('themeToggleToLight')}
				onclick={toggleTheme}
			>
				{#if isLight}
					<SunIcon size={16} />
				{:else}
					<MoonIcon size={16} />
				{/if}
			</button>
			<LanguageSwitcher />
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

	.top-bar-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.wordmark {
		font-family: var(--font-wordmark);
		font-size: 1.35rem;
		color: var(--color-text);
	}

	.wordmark-accent {
		color: var(--color-accent);
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
