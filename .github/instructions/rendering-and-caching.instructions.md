---
description: Server vs client components, the async request APIs, Cache Components and "use cache", revalidation, streaming, navigation and bundle discipline.
applyTo: "src/app/**,src/proxy.ts,next.config.ts,src/modules/**/components/**"
---

# Rendering and Caching

Caching a multi-tenant ERP wrong is a data-leak bug, not a performance regression. The rules below
decide what renders where, what may be cached, and what must never be.

This project targets Next.js 16 with the App Router. Its conventions differ from older App Router
code found online — prefer these rules over a tutorial written for Next.js 14 or 15.

## Server by default

A component is a server component unless it needs the browser. Add `"use client"` only for state,
effects, event handlers, refs, browser APIs or a client-only library.

```text
Server component      layout, page shell, static content, server-side prefetch, metadata
Client component      forms, tables with interaction, dialogs, charts, anything with onClick
```

Push the client boundary as low as it will go. A page marked `"use client"` at the top drags its
entire subtree into the browser bundle, including content that never changes.

```tsx
// Bad — the whole screen becomes client-rendered for one button
"use client";
export default function QuotationsPage() {
  /* header, filters, table, actions */
}

// Good — the interactive leaf opts in
export default async function QuotationsPage() {
  return (
    <PageShell title="Quotations">
      <QuotationsTable /> {/* this file is "use client" */}
    </PageShell>
  );
}
```

Never pass a function, a class instance, a `Date` you rely on by reference, or a whole API client
from a server component into a client component — props crossing that boundary must be
serialisable.

Keep secrets in server components. Anything a client component receives as a prop is visible in the
browser payload, so never pass a token, a server-only config value or another user's record into
one, and never place a secret in a `NEXT_PUBLIC_` variable to make it reachable.

## Async request APIs

`params`, `searchParams`, `cookies()`, `headers()` and `draftMode()` are asynchronous and must be
awaited. Synchronous access was removed in Next.js 16.

```tsx
export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const filters = parseFilters(await searchParams);
  const session = await getSession(); // awaits cookies() internally
}
```

Validate `params` and `searchParams` with Zod before use. They are user input: an `id` from the URL
is untrusted, and a malformed filter should fall back to a default rather than throw.

## What may be cached

```text
Safe to cache          design-system assets, static marketing/help content, public reference
                       data that is identical for every tenant
Never cache            anything tenant-scoped, user-scoped, permission-dependent, financial,
                       or stock-related
```

Cache Components are enabled through `cacheComponents: true` in `next.config.ts`, and caching is
opt-in per function, component or page through the `"use cache"` directive, with `cacheLife` for
duration and `cacheTag` for targeted invalidation.

```ts
async function getCountries() {
  "use cache";
  cacheLife("days");
  cacheTag("countries");
  return referenceApi.countries();
}
```

A `"use cache"` boundary cannot read the session — that is precisely why it is safe, and why almost
nothing in this ERP belongs inside one. If a value depends on who is asking or which tenant they
belong to, it renders dynamically.

```text
Bad:   "use cache" around the receivables summary
Bad:   "use cache" around a component that awaits cookies() for the tenant
Good:  "use cache" around the country, currency or unit-of-measure list
```

The same rule applies to accidental caching: never hold data in a module-level variable in an
`api.ts` or a server helper. On a warm server that value is shared across users and tenants.

## Revalidation

`revalidateTag` takes a tag and a `cacheLife` profile, and gives stale-while-revalidate behaviour —
suitable for shared reference data where a short delay is acceptable.

```ts
revalidateTag("countries", "max");
```

When a user must immediately see their own change, use `updateTag` in a server action for
read-your-writes semantics, or let TanStack Query invalidation handle it — which is the normal path
for ERP writes, since those screens are client-cached rather than server-cached.

```text
Reference data changed        revalidateTag(tag, profile)
User's own write, server      updateTag(tag) in a server action
User's own write, client      queryClient.invalidateQueries (the usual case here)
```

Do not mix both caches for the same data. Pick the layer that owns a screen's freshness — server
cache for shared static data, TanStack Query for everything tenant-scoped — and stay there.

## Streaming and loading states

Every route that fetches gets a `loading.tsx`, and slow independent sections are wrapped in
`Suspense` with a skeleton so the shell paints immediately.

```text
app/(app)/quotations/
├── page.tsx
├── loading.tsx        skeleton matching the real layout
└── error.tsx          recoverable error with a retry
```

Skeletons approximate the final layout so the page does not jump when data lands. Do not stream a
form or a figure the user might act on before it is complete — a half-rendered total invites a wrong
decision.

`error.tsx` shows a friendly message mapped from the error code and a retry action, and never a
stack trace. Add `not-found.tsx` where a missing record is expected, and `global-error.tsx` once for
the root.

## Navigation

Use `<Link>` for internal navigation and `useRouter` only for programmatic cases such as
post-submit redirects. Keep list state in the URL so back, forward, refresh and share all behave.

```ts
router.replace(`?${params}`, { scroll: false }); // filter change — no history entry
router.push(`/quotations/${id}`); // real navigation
```

Filter and pagination changes use `replace` so the back button does not walk through every keystroke;
opening a record uses `push`. Warn before navigating away from a dirty form.

## Route handlers and proxy

Route handlers under `src/app/api/` are dynamic and uncached. They exist for the BFF work described
in the API instructions — session cookies, uploads, server-only secrets.

`proxy.ts` (the Next.js 16 replacement for `middleware.ts`, exporting a `proxy` function and running
on the Node.js runtime) does optimistic redirects and request-id injection only. Keep it small and
fast: no data fetching, no permission logic, no session validation treated as authoritative.

```ts
// src/proxy.ts
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-request-id", crypto.randomUUID());
  return NextResponse.next({ request: { headers } });
}
```

Its matcher must exclude `_next`, static assets and API routes, and it must be re-tested against
dynamic and catch-all segments when changed.

## Bundle discipline

The client bundle is a budget. Before adding a dependency, check whether the platform, an existing
dependency or a server component already solves the problem.

```text
Prefer                          Avoid
server rendering                shipping a library to format a date
dynamic import for heavy UI     importing a chart or editor bundle on every page
Intl.* for dates and numbers    a moment-style date library
native fetch                    an extra HTTP client alongside the shared one
```

Load heavy, below-the-fold or modal-only UI — charts, rich-text editors, PDF viewers, spreadsheet
exporters — with `dynamic()` so it is fetched when opened. Import icons individually rather than
pulling in a whole icon set.

Use `next/image` with `remotePatterns` configured, and `next/font` so text does not reflow on load.
`images.domains` is deprecated — use `remotePatterns`.

## Performance guardrails

Avoid:

```text
Waterfall requests            Rendering thousands of rows at once
Fetching in a loop            Re-fetching on every keystroke
Fetching in useEffect         Large synchronous work on the main thread
```

Use:

```text
parallel requests  server prefetch  pagination  virtualised long lists
debounced search   memoised expensive derivations  dynamic imports  job-based bulk work
```

Requests that do not depend on each other are issued in parallel, not awaited one after another. A
list that fans out one request per row is a defect, not a style preference — take the data from the
list response or add a batched endpoint on the backend.

## Rendering review checklist

- Client boundary is as low as possible; no page-level `"use client"` for one interactive child.
- `params`, `searchParams`, `cookies()` and `headers()` are awaited and validated.
- No tenant-scoped, user-scoped or financial data inside a `"use cache"` boundary or ISR page.
- No module-level mutable state holding request data on the server.
- Query cache and client stores cleared on logout and tenant switch.
- `loading.tsx` and `error.tsx` present; skeletons match the real layout.
- Filter and pagination changes use `replace`; navigation uses `push`.
- No secret or server-only value passed into a client component.
- Heavy UI dynamically imported; no new dependency the platform already covers.
- Requests parallelised, lists paginated, long lists virtualised.
