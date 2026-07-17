<script lang="ts">
	import { locale, t } from '$lib/i18n';
</script>

<main>
	<div class="card">
		<h1>{$t('welcome')}</h1>
		<div class="lang-switch">
			<button class:is-active={$locale === 'en'} onclick={() => locale.set('en')}>EN</button>
			<button class:is-active={$locale === 'it'} onclick={() => locale.set('it')}>IT</button>
		</div>
	</div>
</main>

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
	}

	.lang-switch {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
</style>
