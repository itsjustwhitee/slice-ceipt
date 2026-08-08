<!-- src/routes/share-target/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import { resetSession, loadReceipt } from '$lib/stores/receipt';
	import { addPhotos } from '$lib/stores/photos';

	// Must match SHARE_CACHE in service-worker.ts, which writes these entries.
	const SHARE_CACHE = 'share-target-payload';

	onMount(async () => {
		await receiveSharedFiles();
		await goto(`${base}/`);
	});

	async function receiveSharedFiles(): Promise<void> {
		if (!('caches' in window)) return;

		const cache = await caches.open(SHARE_CACHE);
		const metaResponse = await cache.match('meta');
		if (!metaResponse) return;

		const { count } = (await metaResponse.json()) as { count: number };
		const keys = ['meta', ...Array.from({ length: count }, (_, index) => `file-${index}`)];
		const files: File[] = [];

		for (let index = 0; index < count; index += 1) {
			const response = await cache.match(`file-${index}`);
			if (!response) continue;
			const blob = await response.blob();
			const filename = decodeURIComponent(response.headers.get('x-filename') ?? `receipt-${index}`);
			files.push(new File([blob], filename, { type: blob.type }));
		}

		await Promise.all(keys.map((key) => cache.delete(key)));
		if (files.length === 0) return;

		resetSession();
		const pdf = files.find((file) => file.type === 'application/pdf');
		if (pdf) {
			void loadReceipt(pdf);
			return;
		}
		addPhotos(files);
	}
</script>

<div class="card">
	<p class="status">{$t('extractionInProgress')}</p>
</div>

<style>
	.status {
		font-weight: 600;
	}
</style>
