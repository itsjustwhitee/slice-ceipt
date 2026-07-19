<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<g transform="matrix(50.992196,0,0,47.663768,-211.906355,-171.965217)">
		<g transform="matrix(0,1,-1,0,22.5,0)">
			<path
				d="M7,12L12,17M12,17L17,12M12,17L12,4"
				style="fill:currentColor;stroke:currentColor;stroke-width:2.5px;stroke-linecap:round;stroke-linejoin:round;"
			/>
		</g>
	</g>
</svg>
