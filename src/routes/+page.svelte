<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { locale } from '$lib/i18n';
	import { step, mode } from '$lib/stores/receipt';
	import Uploader from '$lib/components/Uploader.svelte';
	import SetupStep from '$lib/components/SetupStep.svelte';
	import GroupItemList from '$lib/components/GroupItemList.svelte';
	import SingleItemList from '$lib/components/SingleItemList.svelte';
	import GroupSummary from '$lib/components/GroupSummary.svelte';
	import SingleSummary from '$lib/components/SingleSummary.svelte';
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
