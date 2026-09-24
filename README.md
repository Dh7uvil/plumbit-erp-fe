# Plumbit ERP front-end

Next.js 16 App Router client for the Plumbit ERP API.

## Requirements

- Node.js 20.9+

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required variables are documented in `.env.example`. Server-only values never use the `NEXT_PUBLIC_` prefix.

## Scripts

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run format       # Prettier
npm run test:e2e     # Playwright auth flows (starts a mock API)
```

First-time e2e setup:

```bash
npx playwright install chromium
```

## Adding a documentation page

In-app user documentation lives under `src/content/docs/` as MDX files, with metadata in `src/config/docs-catalog.ts`.

1. Add a page entry to the appropriate category in `docs-catalog.ts` (`slug`, `title`, `description`, optional `keywords`, `related`, `appHrefs`).
2. Create `src/content/docs/<category>/<slug>.mdx` using MDX components such as `<Callout>`, `<Steps>`, `<Prerequisites>`, `<ImpactTable>`, `<AppLink>`, and `<DocLink>`.
3. Regenerate loaders: `node scripts/generate-docs-loaders.mjs`
4. Run tests: `npm test` (validates catalog ↔ file ↔ loader parity)

Optional: `node scripts/generate-docs-mdx.mjs` scaffolds new pages; `node scripts/enhance-docs-content.mjs` updates key workflow pages.

Documentation routes are under `/docs` and are visible to all authenticated users (no permission gate).
