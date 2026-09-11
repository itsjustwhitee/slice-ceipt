/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Injected by vite.config.ts's `define` at build time.
	const __APP_VERSION__: string;
	const __COMMIT_HASH__: string;
}

export {};
