<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { locale, t } from '$lib/i18n';
	import { step, resetSession } from '$lib/stores/receipt';
	import Uploader from '$lib/components/Uploader.svelte';
	import SetupStep from '$lib/components/SetupStep.svelte';
</script>

<main>
	<div class="lang-switch">
		<button class:is-active={$locale === 'en'} onclick={() => locale.set('en')}>EN</button>
		<button class:is-active={$locale === 'it'} onclick={() => locale.set('it')}>IT</button>
	</div>

	{#if $step === 'upload'}
		<Uploader />
	{:else if $step === 'setup'}
		<SetupStep />
	{:else}
		<div class="card">
			<h1>{$t('itemsPlaceholder')}</h1>
			<button onclick={resetSession}>{$t('startOver')}</button>
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.lang-switch {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		justify-content: flex-end;
	}
</style>
