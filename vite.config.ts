import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	define: {
		// Workbox's modules (bundled into src/service-worker.ts below) read
		// this at import time; without it defined for the service-worker
		// build, they throw at runtime instead of tree-shaking to their
		// production behavior. See @vite-pwa/sveltekit's injectManifest docs.
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			base: (process.env.BASE_PATH ?? '') + '/',
			registerType: 'autoUpdate',
			// A custom service worker (src/service-worker.ts) is required, not
			// the auto-generated default, so it can handle the Web Share
			// Target's POST request itself — this app is fully static (no
			// backend), so the service worker is the only place that request
			// can be intercepted and answered at all. See that file for the
			// share-target handling and the tesseract runtime-caching rule
			// that used to live in `workbox.runtimeCaching` below.
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			manifest: {
				name: 'SliceCeipt',
				short_name: 'SliceCeipt',
				start_url: '.',
				display: 'standalone',
				background_color: '#2b2b30',
				theme_color: '#ff7910',
				icons: [
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
					{ src: 'pwa-192x192-transparent.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: 'pwa-512x512-transparent.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
				],
				// Lets the OS share sheet offer "SliceCeipt" as a target when the
				// user shares a receipt photo/PDF from their camera roll or
				// another app, once SliceCeipt is installed to the home screen —
				// avoids the save-then-find-then-reopen round trip. "receipts"
				// (the files[].name below) must match the field name
				// service-worker.ts reads with `formData.getAll(...)`.
				share_target: {
					action: 'share-target',
					method: 'POST',
					enctype: 'multipart/form-data',
					params: {
						files: [{ name: 'receipts', accept: ['image/*', 'application/pdf'] }]
					}
				}
			},
			injectManifest: {
				// Same reasoning as the tesseract-assets runtime-caching rule in
				// service-worker.ts: large, only needed if OCR actually runs, so
				// excluded from the install-time precache and cached at
				// first-use time instead.
				globIgnores: ['**/tesseract/**']
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
