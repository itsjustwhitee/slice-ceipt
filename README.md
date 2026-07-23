# SliceCeipt

A free, mobile-first web app for splitting shared receipts (photo or PDF) among multiple people, item by item, down to the cent.

## Status

✅ Feature-complete: upload/scan a receipt (or skip and enter items by hand), split it either as a named group (per-item/per-unit assignment, custom shares) or solo (just your own fraction of each item), and get a shareable summary, all offline-capable, in English or Italian.

## How it works

- **No backend, no accounts, no database.** The entire app is a static site: OCR and PDF parsing run client-side, in your browser.
- **Installable PWA.** Works offline after the first visit, which comes in handy when you're splitting a receipt with poor signal.
- **Free to run, free to host.** Deployed via GitHub Pages, no paid services involved.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) + TypeScript, built as a fully static, prerendered site (`@sveltejs/adapter-static`)
- [Vitest](https://vitest.dev/) for unit tests
- [`@vite-pwa/sveltekit`](https://vite-pwa-org.netlify.app/frameworks/sveltekit) for the installable/offline PWA support

## Developing

Requires npm (this project uses npm exclusively, no yarn/pnpm).

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

## Future improvements

Ideas not yet implemented, roughly in order of how much they'd help:

- **More locales.** The i18n layer is just a dictionary lookup (`src/lib/i18n`), so adding a language is mostly translation work, not architecture work.
- **Export the summary as an image or PDF**, not just copy/native-share text: nicer for sending in a chat that doesn't render plain text well.
- **A light theme.** Colors are already centralized as CSS custom properties (`src/app.css`), so this is a matter of defining a second palette and a toggle, not restructuring styles.
- **Wider receipt-format coverage.** The parser's header/footer/discount heuristics (`src/lib/parsing`) are tuned against real Italian receipts; broadening them against other countries' formats would make OCR extraction useful to more people.

## Contributing

Bug reports and pull requests are welcome.\
You can reach me also through contacts on my profile or on [my website](https://justwhitee.org/#cta).