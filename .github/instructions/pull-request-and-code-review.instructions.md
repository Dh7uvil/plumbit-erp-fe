---
description: Branching, commit format, pull request expectations and the front-end review checklist including non-negotiable guardrails.
applyTo: "**"
---

# Pull Request and Code Review

## Branches

```text
main  develop  feature/*  bugfix/*  hotfix/*  release/*
```

## Commit format

```text
feat: add quotation approval flow
fix: clear query cache on tenant switch
refactor: extract shared data-table toolbar
style: align invoice totals column
chore: update dependencies
docs: document form validation conventions
```

## Never commit

```text
.env  .env.local  credentials  private keys  API keys  large generated files
build output  node_modules  screenshots of real customer data
```

If a secret is committed, rotate it — removing the file is not sufficient. A secret that reached a
client bundle is public from the moment it deployed.

## Pull request expectations

A pull request should be the smallest clean change that delivers the requirement. It states what
changed and why, names the backend endpoints it consumes, and calls out anything that affects the
shared client bundle size or a shared primitive used by other screens.

UI changes include before-and-after screenshots, and a note on the states that were checked —
loading, empty, error, no access — since those are where front-end defects hide. If the change depends
on a backend change, say so and link it.

Before requesting review, run the local gates: TypeScript, ESLint, Prettier, a production build, and
the Playwright specs covering any flow you touched.

## Review checklist

**Structure**

- Feature lives in the right module slice; no business logic in a route segment.
- HTTP only in the slice's `api.ts` through the shared client; no stray `fetch`.
- No duplicated request, type or Zod schema that another slice already owns.
- `src/shared/` free of module business logic and domain-specific types.
- Client boundary as low as possible; no page-level `"use client"` for one interactive child.

**Data and state**

- Server data owned by TanStack Query; not copied into `useState` or Zustand.
- Query keys built by the slice's factory and include every parameter that changes the result.
- Mutations invalidate every query they affect, including other slices.
- Responses validated with Zod; no `any`, no hand-written duplicate types.
- Page, filters and sort live in the URL; lists are paginated with an enforced maximum page size.

**Security and tenancy**

- No token in `localStorage`, `sessionStorage`, a store or a non-httpOnly cookie.
- No `tenant_id` sent from the client to select a tenant.
- Query cache and client stores cleared on logout and tenant switch.
- No tenant-scoped, user-scoped or financial data inside a `"use cache"` boundary or ISR page.
- No secret or server-only value reaching a client component or a `NEXT_PUBLIC_` variable.
- Permission gating present at navigation, route and action level — and understood as UX, not enforcement.
- Redirect targets validated; no unsanitised `dangerouslySetInnerHTML`.

**Correctness**

- No float arithmetic on money; totals taken from the backend.
- Money rendered with its currency; historical documents use their stored `exchange_rate`.
- Timestamps treated as UTC and rendered in the user's timezone.
- Available actions driven by the backend, not by a hardcoded status table.
- No client-generated document number; posted records offer no edit affordance.
- `params` and `searchParams` awaited and validated.

**UI**

- Shared primitives reused; no forked or near-duplicate component.
- Loading, empty, error and no-access states all present, with skeletons matching the layout.
- Forms use react-hook-form with the slice's Zod schema; server field errors mapped to fields.
- Submit disabled while pending; destructive actions confirmed with the consequence named.
- Keyboard operable, labelled, focus-visible, not reliant on colour alone, contrast meets AA.
- Design tokens only — no hardcoded colours, spacing or font sizes.

**Operational**

- Errors reported through `src/integrations/error-reporting/`; no vendor SDK in a feature.
- No credentials, tokens, PII, financial figures or full response bodies logged or reported.
- No leftover `console.log`.
- Bulk and long-running work delegated to backend jobs, not done in the browser.

**Quality**

- TypeScript, ESLint, Prettier and a production build all pass.
- Playwright coverage added or updated for a critical flow.
- No new dependency unless existing ones genuinely cannot solve the problem; bundle impact justified.
- Not over-engineered — simple and maintainable wins.

## Non-negotiable guardrails

A pull request that violates any of these is rejected regardless of its other merits.

```text
1.  Never treat a front-end check as security.
2.  Never store a token outside an httpOnly cookie.
3.  Never send tenant_id from the client to choose a tenant.
4.  Never leave tenant data in the cache across a tenant switch or logout.
5.  Never cache tenant-scoped, user-scoped or financial data on the server.
6.  Never expose a secret through NEXT_PUBLIC_ or a client component prop.
7.  Never call fetch outside the shared client and slice api.ts.
8.  Never use float arithmetic for money.
9.  Never display a monetary value without its currency.
10. Never recompute a historical document's base amount from a newer exchange rate.
11. Never hardcode a workflow transition table in the front-end.
12. Never offer an edit or delete affordance on a posted financial record.
13. Never generate a document number in the browser.
14. Never render an unbounded list or a raw backend error message.
15. Never put business logic in a route segment or a component.
16. Never import a vendor SDK outside src/integrations/.
17. Never let AI output change ERP data without explicit user confirmation.
18. Never log or report credentials, tokens, PII or financial figures.
19. Never ship a flow that cannot be completed with a keyboard.
20. Never commit secrets.
```
