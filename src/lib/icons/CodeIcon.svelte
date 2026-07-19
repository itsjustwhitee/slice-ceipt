<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<g transform="matrix(47.642363,0,0,47.642363,-171.708361,-171.708361)">
		<path
			d="M9,8L5,11.692L9,16M15,8L19,11.692L15,16"
			style="fill:none;stroke:currentColor;stroke-width:2.49px;stroke-linecap:round;stroke-linejoin:round;"
		/>
	</g>
</svg>
