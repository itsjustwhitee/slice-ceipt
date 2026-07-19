<script lang="ts">
	interface Props {
		size?: number;
	}
	let { size = 20 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<g transform="matrix(24.324808,0,0,24.324808,10.803069,302.700767)">
		<g transform="matrix(1,0,0,1,-414,-1049)">
			<path
				d="M442,1049L418,1049C415.791,1049 414,1050.79 414,1053C414,1055.21 415.791,1057 418,1057L442,1057C444.209,1057 446,1055.21 446,1053C446,1050.79 444.209,1049 442,1049"
				style="fill:currentColor;"
			/>
		</g>
	</g>
</svg>
