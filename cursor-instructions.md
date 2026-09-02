# Cursor Instructions — Plumbit ERP Front-end

You are working on a production-grade multi-tenant UAE trading ERP front-end built with Next.js 16
(App Router), React 19, TypeScript, Tailwind CSS with shadcn/ui, TanStack Query and Zod.

The product scope is Zoho Books + Inventory + CRM / Odoo Sales, Purchase, Inventory, Accounting,
CRM: quotes, orders, invoices, GRN, credit/debit notes, payments, stock, journals, UAE VAT, and
UAE e-invoicing through third-party Accredited Service Providers (ASPs). Manufacturing, POS, full
payroll, e-commerce, projects/timesheets, recurring invoices, and banking/PDC are out of scope.
Plumbit is not a Peppol Access Point and does not treat Zoho Books or TallyPrime as the ledger.

Follow the project's architecture and guardrails strictly. Tenant isolation, session handling and
the integrity of financial figures have higher priority than convenience. Do not bypass these rules
even if doing so makes implementation easier.

The single most important rule: **the front-end enforces nothing.** Hiding a button, gating a route
or disabling a field is a usability affordance. The backend is the source of business truth and the
only security boundary, and this codebase is written on the assumption that a user will try to go
around the UI.

Screens without a live API stay omitted or empty. Follow
[docs/administration-api-gaps.md](docs/administration-api-gaps.md) — do not mock ERP settings,
lock dates, or e-invoicing fields.

## Architecture

```text
Route Segment → Feature Component → Query/Mutation Hook → slice api.ts → Backend /api/v1
```

Keep the front-end modular in the same shape as the backend, so a feature is found in the same place
on both sides. Route segments are a thin routing layer, components render and interact, hooks own
caching, and `api.ts` is the only place that performs HTTP. Backend Identity is `app/auth/`; this
repo keeps the folder `src/modules/users-management/` and permission prefix `identity.*`.

## Module map

Modules sit under `src/modules/`, with shared building blocks in `src/shared/`. Each slice owns its
own `api.ts`, `schemas.ts`, `queries.ts`, `mutations.ts`, `permissions.ts` and `components/`.

Label implemented vs planned. Register nav only for slices with a live API.

```text
src/
├── app/                          routing only — thin segments, (auth) and (app) shells,
│                                 loading/error files, BFF route handlers under app/api/
├── proxy.ts                      optimistic redirects only, never the auth boundary
├── modules/
│   ├── users-management/         Identity (BE: app/auth/)
│   │                             implemented: auth, users, roles, permissions,
│   │                             tenants/org-settings, branches, departments,
│   │                             employees (nested), audit-logs
│   │                             planned: tenant operational settings (negative stock, lock dates)
│   ├── crm/
│   │                             implemented: customers, contacts
│   │                             planned: leads, opportunities, activities
│   ├── inventory-management/
│   │                             implemented: units, categories, products, price-lists, warehouses
│   │                             planned: stock, stock-transfers, stock-adjustments,
│   │                             goods-receipts (GRN), delivery-notes, sales-returns
│   ├── erp/
│   │                             implemented: currencies, exchange-rates, taxes, payment-terms,
│   │                             terms-templates, document-sequences, suppliers, quotations
│   │                             planned: sales-orders, sales-invoices, credit-notes,
│   │                             customer-payments, purchase-orders, purchase-invoices,
│   │                             debit-notes, supplier-payments, accounting (COA, journals, AR, AP),
│   │                             logistics, einvoicing status UX on invoices and credit notes
│   ├── communication-service/    planned: email, whatsapp, chat, meetings
│   └── notifications-service/    planned: notifications, templates, delivery
├── shared/                       api/ auth/ components/ hooks/ lib/ providers/ types/
├── config/                       env.ts navigation.ts constants.ts
└── integrations/                 third-party SDK wrappers only — never Zoho/Tally/ASP calls
```

Directories and files are `kebab-case`; components, types and Zod schemas are `PascalCase`. Modules
are a code concept only — they never appear in the URL, which mirrors the backend's flat set of
hyphenated plural resources (`src/modules/erp/purchase-invoices/` → `/purchase-invoices` →
`/api/v1/purchase-invoices`). Keep `/credit-notes`, `/debit-notes`, `/customer-payments`,
`/supplier-payments`, `/delivery-notes` unique.

Document-number prefixes (backend-generated): `QUO`, `SO`, `DN` (delivery), `INV`, `CN`, `PO`,
`GRN`, `BILL`, `SDN` (debit notes).

## Detailed instruction files

Read the relevant file before working in that area — each one is the authority for its topic.

| File                                                                                                | Use it when                                                                                                                   |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [adding-a-new-module](.github/instructions/adding-a-new-module.instructions.md)                     | Creating a module or feature slice; module registry, folder layout, routing, layer responsibilities, naming                   |
| [api-client-and-data-fetching](.github/instructions/api-client-and-data-fetching.instructions.md)   | Calling the backend; the shared client, response envelope, error codes, query keys, pagination, filtering, sorting, mutations |
| [frontend-domain-boundaries](.github/instructions/frontend-domain-boundaries.instructions.md)       | Session and tenancy, permissions as UX, module ownership, providers, money, workflow and AI rules                             |
| [erp-documents-and-workflows](.github/instructions/erp-documents-and-workflows.instructions.md)     | Save vs Post, available_actions, lock/stock, VAT display, e-invoicing status UX, jobs                                         |
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
  sources of truth for the same value. Saved filters belong in the URL only.
- Keep the session in an httpOnly cookie. Never store a token in `localStorage`, a store or a
  non-httpOnly cookie.
- Never send `tenant_id` from the client to select a tenant — it comes from the session.
- Clear the query cache and client stores on logout and tenant switch.
- Never cache tenant-scoped, user-scoped or financial data on the server, and never hold request
  data in a module-level variable.
- Gate navigation, routes and actions on permissions, understanding that the backend enforces them.
  **Create, read, update and delete are independent** — having `*.create` does not show Edit/Save on
  an existing record. Use `useCrudPermissions(slicePermissions)` for standard CRUD (or `can()` for
  extra actions). Hide missing affordances; provide a view path (read-only dialog or detail page).
- Never do float arithmetic on money; display the backend's totals, always with their currency.
  Never recalculate VAT, tax or exchange in the browser.
- Treat timestamps as UTC and render them in the user's timezone.
- Drive available actions from `document.available_actions`, never from a hardcoded status table.
- Never generate a document number in the browser, and never offer to edit a posted or exchanged
  record — offer the correction document the API supports.
- Never post a document as a side effect of save.
- Paginate every list; keep page, filters and sort in the URL.
- Map backend error codes to user-facing messages; never surface a raw error or stack trace.
- Handle loading, empty, error and no-access states on every screen.
- Delegate bulk and long-running work (import, export, PDF, e-invoice submit) to backend jobs;
  the browser starts and tracks them. Never call an ASP from the browser.
- Keep third-party SDKs under `src/integrations/`; never import a vendor SDK into a feature.
- Never expose a secret through `NEXT_PUBLIC_`, a client component prop or a committed file.
- Never log or report credentials, tokens, PII or financial figures.
- Keep the client bundle lean; prefer the platform and server rendering over a new dependency.
- Reuse existing primitives, hooks and utilities; do not duplicate functionality.
- Every flow must be completable with a keyboard and legible to a screen reader.
- Keep interface copy in components; do not concatenate sentences. Do not add Arabic/RTL until
  a product decision exists. Do not retrofit an i18n library in this pass.
- Do not over-engineer simple requirements — prefer simple, maintainable implementations.

## Before implementing any feature

1. Inspect the existing implementation.
2. Identify the correct module and slice.
3. Read the backend endpoint's OpenAPI schema before writing types by hand.
4. Identify existing slice APIs, hooks and Zod schemas to reuse.
5. Identify existing shared components, formatters and form patterns to reuse.
6. Identify the permissions the feature needs (`identity.*` / `crm.*` / `inventory.*` / `erp.*`).
   Gate create/view/update/delete independently via `useCrudPermissions(slicePermissions)` (or
   `can()` for extra actions). Hide missing affordances and provide a view path — do not treat
   create as update.
7. Decide what renders on the server and what must be a client component.
8. Decide what belongs in the URL versus component state.
9. For documents: identify save vs post, `available_actions`, lock/stock, VAT and e-invoicing
   fields. Do not mock settings the tenant API does not expose.
10. Implement the smallest clean solution.
11. Handle loading, empty, error and no-access states.
12. Register the route in `src/config/navigation.ts` with its permission — only if the API exists.
13. Add or update a Playwright spec if the flow is critical.
14. Verify types, linting, formatting and a production build.

## Before building a screen

Check the existing slice, the backend endpoint and its envelope, the permissions involved, the
shared table and form patterns, what belongs in the URL, and which parts must be client
components — then compose it from shared primitives. Gate New / View / Edit / Delete independently
with `useCrudPermissions(slicePermissions)`. For form layout, address blocks, initial contact, and
master-table create, follow the **Forms** subsection in
[ui-and-design-system](.github/instructions/ui-and-design-system.instructions.md). CRUD permission
rules live in
[frontend-domain-boundaries](.github/instructions/frontend-domain-boundaries.instructions.md)
section 4. Document posting, lock, stock and e-invoicing UX live in
[erp-documents-and-workflows](.github/instructions/erp-documents-and-workflows.instructions.md).

## Before wiring a request

Verify the client is used, the path is resource-relative, the response is Zod-validated, the query
key includes every parameter, invalidation covers every affected query (documents **and** stock
together when posting), pagination and filters are in the URL, and error codes are mapped to
messages. Send `Idempotency-Key` on post / payment / einvoice submit.

## Security posture

Treat the browser as an untrusted environment. Nothing the client asserts is authoritative:

```text
session validity  permissions  role  tenant  resource ownership
status transitions  financial values  document numbers  file type  file name
available_actions  einvoice_status
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
21. Never post a document as a side effect of save.
22. Never offer edit on a posted record; offer the correction document the API supports.
23. Never compute available workflow actions locally.
24. Never mock lock dates, negative-stock toggles, or ledger figures.
25. Never recalculate VAT, tax, or exchange in the browser.
26. Never send a draft or a browser-built XML to an e-invoicing provider.
27. Never treat Zoho, Tally, or any ASP as the source of accounting truth.
```

## System overview

Production: AWS Amplify (Next.js) → API Gateway → Lambda (FastAPI) → RDS PostgreSQL. Redis is
not required. The browser never talks to an ASP.

```text
                         ┌────────────────────┐
                         │      Browser       │
                         └─────────┬──────────┘
                                   ▼
                         ┌────────────────────┐
                         │  Next.js App Router│
                         │  AWS Amplify       │
                         └─────────┬──────────┘
                                   ▼
                         ┌────────────────────┐
                         │   ERP Backend      │
                         │  API Gateway       │
                         │  Lambda / FastAPI  │
                         │  source of truth   │
                         └────────────────────┘

Client-side wrappers           Owned by the backend, not the browser

src/integrations/              Backend
  ├── error-reporting            ├── Authentication, tenancy, permissions
  ├── analytics                  ├── Business rules, totals, exchange rates, VAT
  ├── uploads                    ├── Audit logging, posting, lock, stock
  └── realtime                   ├── Email / WhatsApp / storage / AI providers
                                 └── Jobs: imports, exports, PDF, e-invoice submit
                                     ASP (Zoho / Tally / generic) — never from the browser
```
