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
				// The PWA manifest and the generated service-worker/workbox files
				// are emitted relative to the final deployed base path, but
				// SvelteKit's local prerender crawler serves the build output at
				// its own root and doesn't know about that path — so it 404s on
				// these specific files even though they exist correctly once
				// actually deployed. Verified: this is a false positive, not a
				// real broken link. Matched narrowly (not all `.js`) so a genuine
				// broken link in a future page still fails the build.
				const isPwaAsset =
					path.endsWith('manifest.webmanifest') ||
					path.endsWith('/sw.js') ||
					/\/workbox-[\w-]+\.js$/.test(path);
				if (isPwaAsset) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
