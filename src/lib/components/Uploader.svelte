<!-- src/lib/components/Uploader.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import {
		extractionStatus,
		extractionError,
		extractionProgress,
		loadReceipt,
		loadReceiptFromPhotos,
		skipExtraction
	} from '$lib/stores/receipt';
	import { pendingPhotos, addPhotos } from '$lib/stores/photos';
	import { showToast } from '$lib/stores/toast';
	import CameraIcon from '$lib/icons/CameraIcon.svelte';
	import SkipIcon from '$lib/icons/SkipIcon.svelte';
	import UploadIcon from '$lib/icons/UploadIcon.svelte';
	import PhotoBatchReview from './PhotoBatchReview.svelte';
	import PhotoCropEditor from './PhotoCropEditor.svelte';

	let fileInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	let isDragOver = $state(false);
	let editingPhotoId = $state<string | null>(null);

	let editingPhoto = $derived($pendingPhotos.find((p) => p.id === editingPhotoId));
	let editingIndex = $derived($pendingPhotos.findIndex((p) => p.id === editingPhotoId));

	function handleFiles(files: FileList | null) {
		const list = files ? Array.from(files) : [];
		if (list.length === 0) return;
		const pdf = list.find((f) => f.type === 'application/pdf');
		if (pdf) {
			void loadReceipt(pdf);
			return;
		}
		addPhotos(list);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		handleFiles(event.dataTransfer?.files ?? null);
	}

	function retryExtraction() {
		if ($pendingPhotos.length > 0) {
			void loadReceiptFromPhotos($pendingPhotos);
		} else {
			fileInput.click();
		}
	}

	function confirmEdit() {
		if (editingPhoto) {
			const name = $t('photoLabel').replace('{n}', String(editingIndex + 1));
			showToast($t('toastPhotoCorrected').replace('{name}', name), 'success');
		}
		editingPhotoId = null;
	}
</script>

<div class="card">
	{#if $extractionStatus === 'extracting'}
		<h1>{$t('uploadTitle')}</h1>
		<p class="status">{$t('extractionInProgress')}</p>
		<div
			class="progress-track"
			role="progressbar"
			aria-valuenow={Math.round($extractionProgress * 100)}
			aria-valuemin="0"
			aria-valuemax="100"
		>
			<div class="progress-fill" style:width="{$extractionProgress * 100}%"></div>
		</div>
	{:else if $extractionStatus === 'error'}
		<h1>{$t('uploadTitle')}</h1>
		<p class="status status-error">{$t('extractionErrorTitle')}</p>
		{#if $extractionError}<p class="status-detail">{$extractionError}</p>{/if}
		<div class="actions">
			<button onclick={retryExtraction}>{$t('extractionRetry')}</button>
			<button
				class="icon-button"
				aria-label={$t('extractionContinueManually')}
				title={$t('extractionContinueManually')}
				onclick={skipExtraction}
			>
				<SkipIcon />
			</button>
		</div>
	{:else if editingPhoto}
		<PhotoCropEditor
			photo={editingPhoto}
			label={$t('photoLabel').replace('{n}', String(editingIndex + 1))}
			onconfirm={confirmEdit}
			oncancel={() => (editingPhotoId = null)}
		/>
	{:else if $pendingPhotos.length > 0}
		<PhotoBatchReview
			onedit={(id) => (editingPhotoId = id)}
			onaddcamera={() => cameraInput.click()}
			onaddimport={() => fileInput.click()}
			oncontinue={() => void loadReceiptFromPhotos($pendingPhotos)}
		/>
	{:else}
		<h1>{$t('uploadTitle')}</h1>
		<div class="intro">
			<p class="intro-lead">{$t('uploadIntro')}</p>
			<ol class="intro-steps">
				<li><span class="step-num">1</span><span>{$t('uploadStep1')}</span></li>
				<li><span class="step-num">2</span><span>{$t('uploadStep2')}</span></li>
				<li><span class="step-num">3</span><span>{$t('uploadStep3')}</span></li>
			</ol>
		</div>
		<div
			class="dropzone"
			class:is-drag-over={isDragOver}
			role="button"
			tabindex="0"
			onclick={() => fileInput.click()}
			onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
			ondragover={(e) => {
				e.preventDefault();
				isDragOver = true;
			}}
			ondragleave={() => (isDragOver = false)}
			ondrop={handleDrop}
		>
			<UploadIcon size={28} />
			<p>{$t('uploadDropzone')}</p>
		</div>
		<div class="actions">
			<button type="button" class="take-photo" onclick={() => cameraInput.click()}>
				<CameraIcon size={18} />
				{$t('uploadTakePhoto')}
			</button>
			<button
				class="icon-button"
				aria-label={$t('uploadSkip')}
				title={$t('uploadSkip')}
				onclick={skipExtraction}
			>
				<SkipIcon />
			</button>
		</div>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*,application/pdf"
		multiple
		hidden
		onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
	/>
	<input
		bind:this={cameraInput}
		type="file"
		accept="image/*"
		capture="environment"
		hidden
		onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
	/>
</div>

<style>
	.intro-lead {
		margin: 0 0 0.75rem;
		opacity: 0.85;
	}

	.intro-steps {
		list-style: none;
		margin: 0 0 1.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.intro-steps li {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.step-num {
		flex: none;
		width: 1.6rem;
		height: 1.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-accent);
		color: #1a1a1a;
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 0.85rem;
	}

	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		border: 2px dashed color-mix(in srgb, var(--color-text-on-surface) 25%, transparent);
		border-radius: 12px;
		padding: 3rem 1.5rem;
		text-align: center;
		cursor: pointer;
		transition: border-color 0.25s ease-out, background-color 0.25s ease-out;
	}

	.dropzone.is-drag-over {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
	}

	.take-photo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status {
		font-weight: 600;
	}

	.progress-track {
		margin-top: 1rem;
		height: 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-text-on-surface) 12%, transparent);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 999px;
		background: var(--color-accent);
		transition: width 0.2s ease-out;
	}

	.status-error {
		color: var(--color-error);
	}

	.status-detail {
		color: var(--color-text-on-surface);
		opacity: 0.7;
		font-size: 0.9rem;
	}
</style>
