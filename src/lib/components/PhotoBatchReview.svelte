<!-- src/lib/components/PhotoBatchReview.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { pendingPhotos, removePhoto, movePhoto, type PendingPhoto } from '$lib/stores/photos';
	import CropIcon from '$lib/icons/CropIcon.svelte';
	import BinIcon from '$lib/icons/BinIcon.svelte';
	import CameraIcon from '$lib/icons/CameraIcon.svelte';
	import ImageIcon from '$lib/icons/ImageIcon.svelte';

	interface Props {
		onedit: (id: string) => void;
		onaddcamera: () => void;
		onaddimport: () => void;
		oncontinue: () => void;
	}
	let { onedit, onaddcamera, onaddimport, oncontinue }: Props = $props();

	// Object URLs are created per photo id and revoked when that id's photo
	// is removed or its blob is replaced (crop confirm reuses the same id
	// with a new blob) — keyed by id, but each entry remembers which blob it
	// was built from so a same-id blob replacement is detected and rebuilt.
	let urlEntries = new Map<string, { blob: Blob; url: string }>();

	function thumbUrl(photo: PendingPhoto): string {
		const existing = urlEntries.get(photo.id);
		if (existing && existing.blob === photo.blob) return existing.url;
		if (existing) URL.revokeObjectURL(existing.url);
		const url = URL.createObjectURL(photo.blob);
		urlEntries.set(photo.id, { blob: photo.blob, url });
		return url;
	}

	$effect(() => {
		const currentIds = new Set($pendingPhotos.map((p) => p.id));
		for (const [id, entry] of urlEntries) {
			if (!currentIds.has(id)) {
				URL.revokeObjectURL(entry.url);
				urlEntries.delete(id);
			}
		}
	});
</script>

<h2>{$t('photosLoaded').replace('{count}', String($pendingPhotos.length))}</h2>

<ul class="photo-list">
	{#each $pendingPhotos as photo, i (photo.id)}
		<li>
			<img class="thumb" src={thumbUrl(photo)} alt="" />
			<span class="name">{$t('photoLabel').replace('{n}', String(i + 1))}</span>
			<div class="reorder-buttons">
				<button
					type="button"
					class="reorder-btn"
					disabled={i === 0}
					aria-label={$t('movePhotoUp')}
					title={$t('movePhotoUp')}
					onclick={() => movePhoto(photo.id, 'up')}
				>
					&#9650;
				</button>
				<button
					type="button"
					class="reorder-btn"
					disabled={i === $pendingPhotos.length - 1}
					aria-label={$t('movePhotoDown')}
					title={$t('movePhotoDown')}
					onclick={() => movePhoto(photo.id, 'down')}
				>
					&#9660;
				</button>
			</div>
			<button
				type="button"
				class="icon-button"
				aria-label={$t('cropPhoto')}
				title={$t('cropPhoto')}
				onclick={() => onedit(photo.id)}
			>
				<CropIcon size={16} />
			</button>
			<button
				type="button"
				class="icon-button is-danger"
				aria-label={$t('removePhoto')}
				title={$t('removePhoto')}
				onclick={() => removePhoto(photo.id)}
			>
				<BinIcon size={16} />
			</button>
		</li>
	{/each}
</ul>

<div class="add-row">
	<button
		type="button"
		class="icon-button"
		aria-label={$t('addPhotoCamera')}
		title={$t('addPhotoCamera')}
		onclick={onaddcamera}
	>
		<CameraIcon size={16} />
	</button>
	<button
		type="button"
		class="icon-button"
		aria-label={$t('addPhotoImport')}
		title={$t('addPhotoImport')}
		onclick={onaddimport}
	>
		<ImageIcon size={16} />
	</button>
	<button type="button" class="continue" onclick={oncontinue}>{$t('photoContinue')}</button>
</div>

<style>
	.photo-list {
		list-style: none;
		margin: 0.75rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.photo-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: color-mix(in srgb, var(--color-text-on-surface) 6%, transparent);
		border-radius: 8px;
		padding: 0.5rem;
	}

	.thumb {
		width: 2.75rem;
		height: 3.6rem;
		object-fit: cover;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.name {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	.reorder-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.reorder-btn {
		padding: 0.1em 0.5em;
		font-size: 0.6rem;
		line-height: 1;
		border-radius: 6px;
	}

	.reorder-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.add-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.add-row .continue {
		flex: 1;
	}
</style>
