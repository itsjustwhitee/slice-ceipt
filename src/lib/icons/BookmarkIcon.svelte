<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<g transform="matrix(28.571429,0,0,28.571429,0,0)">
		<path
			d="M9.25,1.796L18.75,1.796C21.486,1.796 23.704,4.014 23.704,6.75L23.704,24.75C23.704,25.682 23.176,26.534 22.341,26.948C21.507,27.363 20.509,27.269 19.767,26.705L14,22.331L8.234,26.705C7.491,27.269 6.493,27.363 5.659,26.948C4.824,26.534 4.296,25.682 4.296,24.75L4.296,6.75C4.296,4.014 6.514,1.796 9.25,1.796Z"
			style="fill:currentColor;fill-rule:nonzero;"
		/>
	</g>
</svg>
