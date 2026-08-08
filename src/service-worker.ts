/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Tesseract's OCR assets (WASM core variants + language data) are large
// (tens of MB total) and only needed if the user actually uses OCR —
// excluded from the install-time precache (see `injectManifest.globIgnores`
// in vite.config.ts) and cached here the first time they're actually
// fetched instead, so repeat OCR use still works offline.
registerRoute(
	({ url }) => url.pathname.includes('/tesseract/'),
	new CacheFirst({
		cacheName: 'tesseract-assets',
		plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
	})
);

// Hand-off point between this file and the "/share-target" route
// (src/routes/share-target/+page.svelte): a browser's Web Share Target POST
// can only be answered by a service worker (this app has no backend to
// receive it), and the only place to *put* the shared file(s) so a normal
// page can pick them back up afterward is some form of client-side storage
// — the Cache API is used here (rather than IndexedDB) because a
// `Response` wraps a `Blob` natively, with no serialization step needed for
// the file bytes themselves.
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
					headers: {
						'content-type': file.type,
						// A raw filename isn't a valid header value if it contains
						// non-ASCII/control characters (e.g. accented letters) —
						// encoded going in, decoded by the page reading it back.
						'x-filename': encodeURIComponent(file.name)
					}
				})
			)
		)
	);

	// 303 turns the browser's POST navigation into a GET of the same URL,
	// which the precached "/share-target" page then answers normally —
	// required by the Web Share Target spec, since a POST response can't
	// itself render a page the same way a navigation does.
	return Response.redirect(event.request.url, 303);
}
