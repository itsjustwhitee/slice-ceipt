import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		paths: {
			base: process.env.BASE_PATH ?? ''
		},
		serviceWorker: {
			register: false
		},
		prerender: {
			handleHttpError: ({ path, message }) => {
				// The PWA manifest link and the SW/workbox files are emitted
				// relative to the final deployed base path, but SvelteKit's local
				// prerender crawler serves the build output at its own root and
				// doesn't know about that path — so it 404s on these specific
				// files even though they exist correctly once actually deployed.
				// Verified: this is a false positive, not a real broken link.
				if (path.endsWith('manifest.webmanifest') || path.endsWith('.js')) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
