<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import personalLogo from '$lib/assets/personal-logo.svg';
	import personalLogoOutlined from '$lib/assets/personal-logo-outlined.svg';
	import DocIcon from '$lib/icons/DocIcon.svelte';
	import CodeIcon from '$lib/icons/CodeIcon.svelte';
	import UserIcon from '$lib/icons/UserIcon.svelte';
	import InstallInfoModal from './InstallInfoModal.svelte';

	let installModalOpen = $state(false);

	// See Logo.svelte for why this is a $state corrected in an $effect rather
	// than a direct $theme-bound expression in the template (Svelte's
	// hydration reconciliation would otherwise keep the SSR'd dark-theme
	// image stuck after a reload with light theme saved).
	let personalLogoSrc = $state(personalLogo);

	$effect(() => {
		personalLogoSrc = $theme === 'light' ? personalLogoOutlined : personalLogo;
	});
</script>

<footer class="app-footer">
	<p>{$t('footerPrivacy')}</p>
	<p>{$t('footerLicenseNote')}</p>
	<p>
		{$t('footerInstallNote')}
		<button type="button" class="install-how" onclick={() => (installModalOpen = true)}>
			{$t('footerInstallHow')}
		</button>
	</p>
	<div class="footer-links">
		<a href="/LICENSE.txt" target="_blank" rel="noopener noreferrer">
			<DocIcon size={14} />
			{$t('footerViewLicense')}
		</a>
		<span class="footer-sep">·</span>
		<a href="https://github.com/itsjustwhitee/slice-ceipt" target="_blank" rel="noopener noreferrer">
			<CodeIcon size={14} />
			{$t('footerSource')}
		</a>
		<span class="footer-sep">·</span>
		<a href="https://justwhitee.org" target="_blank" rel="noopener noreferrer">
			<UserIcon size={14} />
			{$t('footerMadeBy')}
		</a>
	</div>
	<a class="personal-logo-link" href="https://justwhitee.org" target="_blank" rel="noopener noreferrer">
		<img class="personal-logo" src={personalLogoSrc} alt={$t('footerPersonalLogoAlt')} />
	</a>
</footer>

<InstallInfoModal open={installModalOpen} onclose={() => (installModalOpen = false)} />

<style>
	.app-footer {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
		color: var(--color-text-muted);
		font-size: 0.8rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.app-footer p {
		margin: 0;
	}

	.install-how {
		display: inline;
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		font: inherit;
		font-size: inherit;
		color: var(--color-accent);
		text-decoration: underline;
		cursor: pointer;
		transition: color 0.25s ease-out;
	}

	.install-how:hover {
		color: var(--color-accent-hover);
	}

	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.app-footer a {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--color-accent);
		text-decoration: underline;
		transition: color 0.25s ease-out;
	}

	.app-footer a:hover {
		color: var(--color-accent-hover);
	}

	.footer-sep {
		opacity: 0.5;
	}

	.personal-logo-link {
		position: relative;
		margin-top: 0.5rem;
		display: inline-flex;
	}

	.personal-logo-link::before {
		content: '';
		position: absolute;
		inset: -0.5rem;
		z-index: -1;
		background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 70%);
		transition: background 0.25s ease-out;
	}

	.personal-logo-link:hover::before {
		background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 18%, transparent) 0%, transparent 75%);
	}

	.personal-logo {
		width: 2rem;
		height: 2rem;
		opacity: 0.85;
		transition: opacity 0.25s ease-out;
	}


	.personal-logo-link:hover .personal-logo {
		opacity: 1;
	}
</style>
