# Cursor Instructions — Plumbit ERP Front-end

You are working on a production-grade multi-tenant ERP front-end built with Next.js 16 (App
Router), React 19, TypeScript, Tailwind CSS with shadcn/ui, TanStack Query and Zod.

Follow the project's architecture and guardrails strictly. Tenant isolation, session handling and
the integrity of financial figures have higher priority than convenience. Do not bypass these rules
even if doing so makes implementation easier.

The single most important rule: **the front-end enforces nothing.** Hiding a button, gating a route
or disabling a field is a usability affordance. The backend is the source of business truth and the
only security boundary, and this codebase is written on the assumption that a user will try to go
around the UI.

## Architecture

```text
Route Segment → Feature Component → Query/Mutation Hook → slice api.ts → Backend /api/v1
```

Keep the front-end modular in the same shape as the backend, so a feature is found in the same place
on both sides. Route segments are a thin routing layer, components render and interact, hooks own
caching, and `api.ts` is the only place that performs HTTP.

## Module map

Modules sit under `src/modules/`, with shared building blocks in `src/shared/`. Each slice owns its
own `api.ts`, `schemas.ts`, `queries.ts`, `mutations.ts`, `permissions.ts` and `components/`.

```text
src/
├── app/                          routing only — thin segments, (auth) and (app) shells,
│                                 loading/error files, BFF route handlers under app/api/
├── proxy.ts                      optimistic redirects only, never the auth boundary
├── modules/
│   ├── users-management/         auth, users, roles, permissions, tenants
│   ├── erp/                      quotations, sales-orders, purchase-invoices, purchase-orders,
│   │                             accounting, logistics, exchange-rates
│   ├── inventory-management/     products, categories, warehouses, stock, transfers, adjustments
│   ├── crm/                      leads, customers, contacts, opportunities, activities
│   ├── communication-service/    email, whatsapp, chat, meetings
│   └── notifications-service/    notifications, templates, delivery
├── shared/                       api/ auth/ components/ hooks/ lib/ providers/ types/
├── config/                       env.ts navigation.ts constants.ts
└── integrations/                 third-party SDK wrappers only
```

Directories and files are `kebab-case`; components, types and Zod schemas are `PascalCase`. Modules
are a code concept only — they never appear in the URL, which mirrors the backend's flat set of
hyphenated plural resources (`src/modules/erp/purchase-invoices/` → `/purchase-invoices` →
`/api/v1/purchase-invoices`).

## Detailed instruction files

Read the relevant file before working in that area — each one is the authority for its topic.

| File                                                                                                | Use it when                                                                                                                   |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [adding-a-new-module](.github/instructions/adding-a-new-module.instructions.md)                     | Creating a module or feature slice; module registry, folder layout, routing, layer responsibilities, naming                   |
| [api-client-and-data-fetching](.github/instructions/api-client-and-data-fetching.instructions.md)   | Calling the backend; the shared client, response envelope, error codes, query keys, pagination, filtering, sorting, mutations |
| [frontend-domain-boundaries](.github/instructions/frontend-domain-boundaries.instructions.md)       | Session and tenancy, permissions as UX, module ownership, providers, money, workflow and AI rules                             |
| [rendering-and-caching](.github/instructions/rendering-and-caching.instructions.md)                 | Server vs client components, async request APIs, `"use cache"`, revalidation, streaming, navigation, bundle size              |
| [ui-and-design-system](.github/instructions/ui-and-design-system.instructions.md)                   | Building screens; primitives, data tables, forms, ERP display conventions, accessibility, styling                             |
| [configuration-and-environment](.github/instructions/configuration-and-environment.instructions.md) | Env variables, public vs server-only, secrets, security headers, uploads, stack, deployment                                   |
| [logging-and-observability](.github/instructions/logging-and-observability.instructions.md)         | Error reporting, redaction, request correlation, Web Vitals, performance guardrails                                           |
| [pull-request-and-code-review](.github/instructions/pull-request-and-code-review.instructions.md)   | Branching, commits, PR content, review checklist, non-negotiables                                                             |
| [testing-and-quality-gates](.github/instructions/testing-and-quality-gates.instructions.md)         | Types and lint as the primary gate, Playwright critical flows, targeted unit tests, CI                                        |

## Core rules

- Keep route segments thin. Put presentation in components, caching in hooks, HTTP in `api.ts`.
- Put every feature in the module that owns it; a slice keeps its API, schemas, hooks, permissions
  and components together.
- `src/shared/` holds only what several modules need, never module business logic or domain types.
- A module reuses another module's slice hooks and API — never a duplicated request or schema.
- Never call `fetch` against the backend outside the shared client and slice `api.ts`.
- Validate every response with Zod and infer types from those schemas. No `any`.
- Business rules belong to the backend. Never invent a rule the client cannot authoritatively know.
- Server data lives only in TanStack Query. URL state lives in search params. Never keep two
  sources of truth for the same value.
- Keep the session in an httpOnly cookie. Never store a token in `localStorage`, a store or a
  non-httpOnly cookie.
- Never send `tenant_id` from the client to select a tenant — it comes from the session.
- Clear the query cache and client stores on logout and tenant switch.
- Never cache tenant-scoped, user-scoped or financial data on the server, and never hold request
  data in a module-level variable.
- Gate navigation, routes and actions on permissions, understanding that the backend enforces them.
- Never do float arithmetic on money; display the backend's totals, always with their currency.
- Treat timestamps as UTC and render them in the user's timezone.
- Drive available actions from the backend document, never from a hardcoded status table.
- Never generate a document number in the browser, and never offer to edit a posted record.
- Paginate every list; keep page, filters and sort in the URL.
- Map backend error codes to user-facing messages; never surface a raw error or stack trace.
- Handle loading, empty, error and no-access states on every screen.
- Delegate bulk and long-running work to backend jobs; the browser starts and tracks them.
- Keep third-party SDKs under `src/integrations/`; never import a vendor SDK into a feature.
- Never expose a secret through `NEXT_PUBLIC_`, a client component prop or a committed file.
- Never log or report credentials, tokens, PII or financial figures.
- Keep the client bundle lean; prefer the platform and server rendering over a new dependency.
- Reuse existing primitives, hooks and utilities; do not duplicate functionality.
- Every flow must be completable with a keyboard and legible to a screen reader.
- Do not over-engineer simple requirements — prefer simple, maintainable implementations.

## Before implementing any feature

1. Inspect the existing implementation.
2. Identify the correct module and slice.
3. Read the backend endpoint's OpenAPI schema before writing types by hand.
4. Identify existing slice APIs, hooks and Zod schemas to reuse.
5. Identify existing shared components, formatters and form patterns to reuse.
6. Identify the permissions the feature needs.
7. Decide what renders on the server and what must be a client component.
8. Decide what belongs in the URL versus component state.
9. Implement the smallest clean solution.
10. Handle loading, empty, error and no-access states.
11. Register the route in `src/config/navigation.ts` with its permission.
12. Add or update a Playwright spec if the flow is critical.
13. Verify types, linting, formatting and a production build.

## Before building a screen

Check the existing slice, the backend endpoint and its envelope, the permissions involved, the
shared table and form patterns, what belongs in the URL, and which parts must be client
components — then compose it from shared primitives.

## Before wiring a request

Verify the client is used, the path is resource-relative, the response is Zod-validated, the query
key includes every parameter, invalidation covers every affected query, pagination and filters are
in the URL, and error codes are mapped to messages.

## Security posture

Treat the browser as an untrusted environment. Nothing the client asserts is authoritative:

```text
session validity  permissions  role  tenant  resource ownership
status transitions  financial values  document numbers  file type  file name
```

The backend validates all of it. Assume any check you write here can be removed by the user, and
never let the UI be the only thing preventing an action.

## Non-negotiable guardrails

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

## System overview

```text
                         ┌────────────────────┐
                         │      Browser       │
                         └─────────┬──────────┘
                                   ▼
                         ┌────────────────────┐
                         │  Next.js App Router│
                         │  server components │
                         │  route handlers    │
                         └─────────┬──────────┘
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
             Session          Permission            Tenant
          httpOnly cookie      gating (UX)       from session
                └──────────────────┼──────────────────┘
                                   ▼
                         ┌────────────────────┐
                         │      Modules       │
                         │  users-management  │
                         │  erp               │
                         │  inventory-        │
                         │    management      │
                         │  crm               │
                         │  communication-    │
                         │    service         │
                         │  notifications-    │
                         │    service         │
                         └─────────┬──────────┘
                         ┌─────────▼──────────┐
                         │  Query / Mutation  │
                         │  hooks — the cache │
                         └─────────┬──────────┘
                         ┌─────────▼──────────┐
                         │   slice api.ts     │
                         └─────────┬──────────┘
                         ┌─────────▼──────────┐
                         │ shared API client  │
                         │ envelope + errors  │
                         └─────────┬──────────┘
                         ┌─────────▼──────────┐
                         │   ERP Backend      │
                         │  FastAPI /api/v1   │
                         │  source of truth   │
                         └────────────────────┘

Client-side wrappers           Owned by the backend, not the browser

src/integrations/              Backend
  ├── error-reporting            ├── Authentication, tenancy, permissions
  ├── analytics                  ├── Business rules, totals, exchange rates
  ├── uploads                    ├── Audit logging
  └── realtime                   ├── Email / WhatsApp / storage / AI providers
                                 └── Jobs: imports, exports, reports, forecasting
```
