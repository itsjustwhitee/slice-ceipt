# SliceCeipt

A free, mobile-first web app for splitting shared receipts (photo or PDF) among multiple people — item by item, down to the cent.

## Status

🚧 Work in progress. This repo currently holds the foundational app shell (SvelteKit scaffold, static prerendering, offline-capable PWA, EN/IT i18n skeleton, deploy pipeline). The actual receipt scanning and splitting UI is being built next.

## How it works

- **No backend, no accounts, no database.** The entire app is a static site — OCR and PDF parsing run client-side, in your browser.
- **Installable PWA.** Works offline after the first visit — useful when you're splitting a receipt with poor signal.
- **Free to run, free to host.** Deployed via GitHub Pages, no paid services involved.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) + TypeScript, built as a fully static, prerendered site (`@sveltejs/adapter-static`)
- [Vitest](https://vitest.dev/) for unit tests
- [`@vite-pwa/sveltekit`](https://vite-pwa-org.netlify.app/frameworks/sveltekit) for the installable/offline PWA support

## Developing

Requires npm (this project uses npm exclusively — no yarn/pnpm).

```sh
npm install
npm run dev -- --open
```

## Building

```sh
npm run build
```

Preview the production build locally with `npm run preview`.

## Testing

```sh
npm run test    # unit tests
npm run check   # type-check
```

## Deployment

Pushes to `main` build and deploy automatically to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
