<!-- src/lib/icons/Logo.svelte -->
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import logoUrl from '$lib/assets/logo.svg';
	import logoOutlinedUrl from '$lib/assets/logo-outlined.svg';

	interface Props {
		size?: number;
	}
	let { size = 32 }: Props = $props();
</script>

<img src={$theme === 'light' ? logoOutlinedUrl : logoUrl} width={size} height={size} alt="" />
