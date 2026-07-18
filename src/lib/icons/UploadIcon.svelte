<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 800 800"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	style="stroke-linecap:round;stroke-linejoin:round;"
>
	<g transform="matrix(33.333333,0,0,33.333333,0,0)">
		<g transform="matrix(-1,0,-0,-1,24,21)">
			<path
				d="M7,12L12,17M12,17L17,12M12,17L12,4"
				style="fill:currentColor;fill-rule:nonzero;stroke:currentColor;stroke-width:2.5px;"
			/>
		</g>
		<path d="M6,20L18,20" style="fill:none;fill-rule:nonzero;stroke:currentColor;stroke-width:2.5px;" />
	</g>
</svg>
