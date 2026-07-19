import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			base: (process.env.BASE_PATH ?? '') + '/',
			registerType: 'autoUpdate',
			manifest: {
				name: 'SliceCeipt',
				short_name: 'SliceCeipt',
				start_url: '.',
				display: 'standalone',
				background_color: '#2b2b30',
				theme_color: '#ff7910',
				icons: [
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
					{ src: 'pwa-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: 'pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
				]
			},
			workbox: {
				// Tesseract's OCR assets (WASM core variants + language data)
				// are large (tens of MB total) and only needed if the user
				// actually uses OCR. Precaching them on every install would
				// force that download on everyone, including users who only
				// ever upload PDFs with a text layer. Excluded from the
				// install-time precache manifest; runtimeCaching below caches
				// them the first time they're actually fetched instead, so
				// repeat OCR use still works offline.
				globIgnores: ['**/tesseract/**'],
				runtimeCaching: [
					{
						urlPattern: /\/tesseract\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'tesseract-assets',
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
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
