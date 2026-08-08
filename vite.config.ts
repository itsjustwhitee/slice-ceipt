import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	define: {
		// Required by the Workbox modules bundled into src/service-worker.ts.
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			base: (process.env.BASE_PATH ?? '') + '/',
			registerType: 'autoUpdate',
			// Custom service worker (src/service-worker.ts) so it can handle
			// the Web Share Target POST itself — this app has no backend.
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
				// "receipts" must match the field name service-worker.ts reads.
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
				// Large, OCR-only assets — cached at first-use in service-worker.ts instead.
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
