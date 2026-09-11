import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { version } from './package.json';

// Baked in at build time so a bug report can be pinned to the exact build
// it came from: the package.json version (bumped by hand on notable
// changes) plus the git commit it was actually built from, which needs no
// manual upkeep and is never wrong. Falls back to "dev" outside a git repo
// (e.g. an npm-published tarball with no .git directory).
function commitHash(): string {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'dev';
	}
}

export default defineConfig({
	define: {
		// Required by the Workbox modules bundled into src/service-worker.ts.
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
		__APP_VERSION__: JSON.stringify(version),
		__COMMIT_HASH__: JSON.stringify(commitHash())
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
