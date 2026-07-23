<!-- src/lib/components/PhotoCropEditor.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { setPhotoCorrection, type PendingPhoto } from '$lib/stores/photos';
	import { warpQuad, quadOutputSize, type Point, type Quad } from '$lib/crop/warp';
	import BackIcon from '$lib/icons/BackIcon.svelte';
	import ResetIcon from '$lib/icons/ResetIcon.svelte';

	interface Props {
		photo: PendingPhoto;
		label: string;
		onconfirm: () => void;
		oncancel: () => void;
	}
	let { photo, label, onconfirm, oncancel }: Props = $props();

	const DISPLAY_MAX = 340;
	const INSET_RATIO = 0.1;

	let stageEl: HTMLDivElement;
	let displayCanvas: HTMLCanvasElement;
	let displayWidth = $state(0);
	let displayHeight = $state(0);
	let handles = $state<Quad>([
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0]
	]);

	let sourceBitmap: ImageBitmap | undefined;
	let scale = 1;
	let dragging: number | null = null;

	function defaultHandles(w: number, h: number): Quad {
		const ix = w * INSET_RATIO;
		const iy = h * INSET_RATIO;
		return [
			[ix, iy],
			[w - ix, iy],
			[w - ix, h - iy],
			[ix, h - iy]
		];
	}

	function drawSource() {
		if (!sourceBitmap) return;
		displayCanvas.width = displayWidth;
		displayCanvas.height = displayHeight;
		const ctx = displayCanvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(sourceBitmap, 0, 0, displayWidth, displayHeight);
	}

	$effect(() => {
		let cancelled = false;
		createImageBitmap(photo.blob).then((bitmap) => {
			if (cancelled) {
				bitmap.close();
				return;
			}
			sourceBitmap = bitmap;
			scale = Math.min(1, DISPLAY_MAX / bitmap.width);
			displayWidth = Math.round(bitmap.width * scale);
			displayHeight = Math.round(bitmap.height * scale);
			handles = defaultHandles(displayWidth, displayHeight);
			drawSource();
		});
		return () => {
			cancelled = true;
			sourceBitmap?.close();
		};
	});

	function resetHandles() {
		handles = defaultHandles(displayWidth, displayHeight);
	}

	function pointerDown(i: number, e: PointerEvent) {
		dragging = i;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function pointerMove(i: number, e: PointerEvent) {
		if (dragging !== i) return;
		const rect = stageEl.getBoundingClientRect();
		const x = Math.min(Math.max(e.clientX - rect.left, 0), displayWidth);
		const y = Math.min(Math.max(e.clientY - rect.top, 0), displayHeight);
		const next = handles.slice() as Quad;
		next[i] = [x, y] as Point;
		handles = next;
	}

	function pointerUp() {
		dragging = null;
	}

	async function confirm() {
		const bitmap = sourceBitmap;
		if (!bitmap) return;
		const fullQuad = handles.map(([x, y]): Point => [x / scale, y / scale]) as Quad;
		const { width, height } = quadOutputSize(fullQuad);
		const outCanvas = document.createElement('canvas');
		outCanvas.width = width;
		outCanvas.height = height;
		const ctx = outCanvas.getContext('2d');
		if (!ctx) return;
		warpQuad(ctx, bitmap, fullQuad, [
			[0, 0],
			[width, 0],
			[width, height],
			[0, height]
		]);
		const correctedBlob = await new Promise<Blob>((resolve, reject) => {
			outCanvas.toBlob(
				(result) => (result ? resolve(result) : reject(new Error('canvas.toBlob failed'))),
				'image/jpeg',
				0.92
			);
		});
		setPhotoCorrection(photo.id, correctedBlob, fullQuad);
		onconfirm();
	}
</script>

<div class="editor-header">
	<button type="button" class="icon-button" aria-label={$t('cancel')} title={$t('cancel')} onclick={oncancel}>
		<BackIcon size={16} />
	</button>
	<h2>{$t('cropEditorTitle').replace('{name}', label)}</h2>
</div>

<div class="stage" bind:this={stageEl} style:width="{displayWidth}px" style:height="{displayHeight}px">
	<canvas bind:this={displayCanvas}></canvas>
	<svg class="outline" width={displayWidth} height={displayHeight} viewBox="0 0 {displayWidth} {displayHeight}">
		<polygon points={handles.map((p) => p.join(',')).join(' ')} />
	</svg>
	{#each handles as handle, i (i)}
		<div
			class="handle"
			role="slider"
			aria-valuenow={i}
			tabindex="0"
			style:left="{handle[0]}px"
			style:top="{handle[1]}px"
			onpointerdown={(e) => pointerDown(i, e)}
			onpointermove={(e) => pointerMove(i, e)}
			onpointerup={pointerUp}
			onpointercancel={pointerUp}
		></div>
	{/each}
</div>

<div class="editor-actions">
	<button
		type="button"
		class="icon-button"
		aria-label={$t('resetVertices')}
		title={$t('resetVertices')}
		onclick={resetHandles}
	>
		<ResetIcon size={16} />
	</button>
	<button type="button" class="continue" onclick={confirm}>{$t('confirmCrop')}</button>
</div>

<style>
	.editor-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.editor-header h2 {
		margin: 0;
	}

	.stage {
		position: relative;
		margin: 0 auto;
		border-radius: 8px;
		overflow: hidden;
		background: #201a16;
		touch-action: none;
	}

	.stage canvas {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
	}

	.outline {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}

	.outline polygon {
		fill: color-mix(in srgb, var(--color-accent) 15%, transparent);
		stroke: var(--color-accent);
		stroke-width: 2;
	}

	.handle {
		position: absolute;
		width: 40px;
		height: 40px;
		margin-left: -20px;
		margin-top: -20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
	}

	.handle::before {
		content: '';
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-accent);
		border: 3px solid #fff;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	.handle:active {
		cursor: grabbing;
	}

	.editor-actions {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}
</style>
