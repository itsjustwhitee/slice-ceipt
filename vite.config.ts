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
				theme_color: '#ff7a3d'
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
