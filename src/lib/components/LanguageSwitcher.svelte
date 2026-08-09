<!-- src/lib/components/LanguageSwitcher.svelte -->
<script lang="ts">
	import { t, locale, type Locale } from '$lib/i18n';
	import flagEn from '$lib/assets/lang/en.webp';
	import flagIt from '$lib/assets/lang/it.webp';

	const OPTIONS: { value: Locale; flag: string; label: string }[] = [
		{ value: 'en', flag: flagEn, label: 'English' },
		{ value: 'it', flag: flagIt, label: 'Italiano' }
	];

	let open = $state(false);
	let current = $derived(OPTIONS.find((option) => option.value === $locale) ?? OPTIONS[0]);

	// Starts matching SSR (detectInitialLocale always returns 'en' server-side)
	// and is corrected in an $effect rather than bound to `current.flag`
	// directly — see Logo.svelte for why a direct binding here would stay
	// stuck on the English flag after a reload with Italian saved.
	let currentFlagSrc = $state(flagEn);

	$effect(() => {
		currentFlagSrc = current.flag;
	});

	function select(value: Locale) {
		locale.set(value);
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="lang-switch">
	<button
		type="button"
		class="lang-trigger"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={$t('languageSwitcherLabel')}
		onclick={() => (open = !open)}
	>
		<img class="flag" src={currentFlagSrc} alt="" width="18" height="18" />
		{current.value.toUpperCase()}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="backdrop" onclick={() => (open = false)}></div>
		<ul class="lang-menu" role="listbox">
			{#each OPTIONS as option (option.value)}
				<li role="option" aria-selected={option.value === $locale}>
					<button type="button" class:is-active={option.value === $locale} onclick={() => select(option.value)}>
						<img class="flag" src={option.flag} alt="" width="18" height="18" />
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.lang-switch {
		position: relative;
	}

	.lang-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5em 0.9em;
		line-height: 1;
	}

	.flag {
		display: block;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 39;
	}

	.lang-menu {
		position: absolute;
		top: calc(100% + 0.4rem);
		right: 0;
		z-index: 40;
		list-style: none;
		margin: 0;
		padding: 0.35rem;
		min-width: 9rem;
		background: var(--color-surface);
		color: var(--color-text-on-surface);
		border-radius: 10px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.lang-menu button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		padding: 0.5em 0.6em;
		text-align: left;
		line-height: 1;
	}

	.lang-menu button.is-active {
		background: var(--color-accent);
		color: #1a1a1a;
	}
</style>
