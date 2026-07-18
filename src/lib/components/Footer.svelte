<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<footer class="app-footer">
	<p>{$t('footerPrivacy')}</p>
	<p>{$t('footerLicenseNote')}</p>
	<div class="footer-links">
		<a href="/LICENSE.txt" target="_blank" rel="noopener noreferrer">{$t('footerViewLicense')}</a>
		<span class="footer-sep">·</span>
		<a href="https://github.com/itsjustwhitee/slice-ceipt" target="_blank" rel="noopener noreferrer">
			{$t('footerSource')}
		</a>
		<span class="footer-sep">·</span>
		<a href="https://justwhitee.org" target="_blank" rel="noopener noreferrer">{$t('footerMadeBy')}</a>
	</div>
</footer>

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
		gap: 0.4rem;
	}

	.app-footer p {
		margin: 0;
	}

	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.app-footer a {
		color: var(--color-text-muted);
		text-decoration: underline;
	}

	.app-footer a:hover {
		color: var(--color-accent);
	}

	.footer-sep {
		opacity: 0.5;
	}
</style>
