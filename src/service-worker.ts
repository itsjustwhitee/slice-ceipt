/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache tesseract assets on first use (excluded from precache in vite.config.ts).
registerRoute(
	({ url }) => url.pathname.includes('/tesseract/'),
	new CacheFirst({
		cacheName: 'tesseract-assets',
		plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
	})
);

// Hand-off to src/routes/share-target/+page.svelte, via the Cache API
// (a Response wraps a Blob natively, unlike IndexedDB).
const SHARE_CACHE = 'share-target-payload';
const SHARE_FIELD_NAME = 'receipts'; // must match manifest.share_target.params.files[].name in vite.config.ts

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
		event.respondWith(handleShareTarget(event));
	}
});

async function handleShareTarget(event: FetchEvent): Promise<Response> {
	const formData = await event.request.formData();
	const files = formData.getAll(SHARE_FIELD_NAME).filter((entry): entry is File => entry instanceof File);

	const cache = await caches.open(SHARE_CACHE);
	await cache.put('meta', new Response(JSON.stringify({ count: files.length })));
	await Promise.all(
		files.map((file, index) =>
			cache.put(
				`file-${index}`,
				new Response(file, {
					// Filename encoded since raw non-ASCII isn't a valid header value.
					headers: { 'content-type': file.type, 'x-filename': encodeURIComponent(file.name) }
				})
			)
		)
	);

	// 303 turns the POST navigation into a GET the "/share-target" page answers.
	return Response.redirect(event.request.url, 303);
}
