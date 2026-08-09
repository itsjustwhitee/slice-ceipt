<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d="M18 6 6 18" />
	<path d="M6 6l12 12" />
</svg>
