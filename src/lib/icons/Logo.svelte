<!-- src/lib/icons/Logo.svelte -->
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import logoUrl from '$lib/assets/logo.svg';
	import logoOutlinedUrl from '$lib/assets/logo-outlined.svg';

	interface Props {
		size?: number;
	}
	let { size = 32 }: Props = $props();

	// Starts matching SSR (always 'dark') and is corrected in an $effect
	// rather than bound directly to $theme in the template: Svelte's
	// hydration reconciliation intentionally keeps the server-rendered `src`
	// when the client's first computed value differs from it (to protect
	// against real hydration bugs), so a direct `$theme === 'light' ? … : …`
	// binding here would stay stuck on the dark-theme image after a reload
	// with light theme saved. An $effect runs after hydration completes, so
	// its assignment is a genuine subsequent update rather than part of the
	// hydration diff, and does get applied.
	let src = $state(logoUrl);

	$effect(() => {
		src = $theme === 'light' ? logoOutlinedUrl : logoUrl;
	});
</script>

<img {src} width={size} height={size} alt="" />
