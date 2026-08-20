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
```
