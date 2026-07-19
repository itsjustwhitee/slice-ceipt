<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

<svelte:head>
	<title>SliceCeipt</title>
	<meta
		name="description"
		content="Snap a photo of a shared receipt, or upload a PDF, and split it fairly among everyone at the table. Runs entirely in your browser: free, no sign-up, no data ever leaves your device."
	/>
	<link rel="canonical" href="https://slice-ceipt.justwhitee.org/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://slice-ceipt.justwhitee.org/" />
	<meta property="og:title" content="SliceCeipt" />
	<meta
		property="og:description"
		content="Split a shared receipt with friends, right in your browser. Free, no sign-up, no data ever leaves your device."
	/>
	<meta property="og:image" content="https://slice-ceipt.justwhitee.org/pwa-512x512.png" />
	<meta name="twitter:card" content="summary" />
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

{@render children()}
