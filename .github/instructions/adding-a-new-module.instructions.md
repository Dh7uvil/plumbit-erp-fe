---
description: How to add a new ERP screen or feature — module registry, feature-slice folder layout, routing, layer responsibilities, render flow and naming.
applyTo: "src/**"
---

# Adding a New Module

Every ERP feature is added as a self-contained slice inside one of the top-level modules,
following the same layout and the same render flow. Do not invent a new shape for a new feature.

The front-end owns presentation, navigation and interaction. It never owns business truth — the
backend does. When in doubt about where a rule lives, it lives in the backend.

## Before writing any code

1. Inspect the existing project structure.
2. Identify the correct top-level module — do not create a new one if the feature belongs to an
   existing module.
3. Read the backend endpoint's OpenAPI schema before writing types by hand.
4. Identify existing slice APIs, query hooks, Zod schemas and shared components and reuse them.
5. Identify the permissions the feature needs — read, create, update, delete, and extras — and
   wire all three levels (nav, route, actions). Gate create/view/update/delete independently via
   `useCrudPermissions(slicePermissions)`.
6. Decide what renders on the server and what must be a client component.
7. Decide what belongs in the URL (page, filters, sort, selected tab) versus component state.
8. Avoid duplicate functionality and unnecessary dependencies.
9. Implement the smallest clean solution.

## Top-level modules

These mirror the backend modules so a feature is found in the same place on both sides.
Everything belongs to exactly one of them.

| Module                  | Owns                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users-management`      | Identity (BE `app/auth/`): **implemented** auth, users, roles, permissions, tenants/org-settings, branches, departments, employees (nested), audit-logs. **Planned:** tenant operational settings.                                                                                                                                                  |
| `erp`                   | **Implemented:** quotations, currencies, exchange-rates, taxes, payment-terms, terms-templates, document-sequences, suppliers. **Planned:** sales-orders, sales-invoices, credit-notes, customer-payments, purchase-orders, purchase-invoices, debit-notes, supplier-payments, accounting (COA, journals, AR, AP), logistics, einvoicing status UX. |
| `inventory-management`  | **Implemented:** units, categories, products, price-lists, warehouses, stock (balances + `/stock-movements`), stock-transfers, stock-adjustments. **Planned:** goods-receipts, delivery-notes, sales-returns.                                                                                                                                       |
| `crm`                   | **Implemented:** customers, contacts. **Planned:** leads, opportunities, activities.                                                                                                                                                                                                                                                                |
| `communication-service` | email, whatsapp, chat, meetings (planned)                                                                                                                                                                                                                                                                                                           |
| `notifications-service` | notifications, templates, delivery status (planned)                                                                                                                                                                                                                                                                                                 |

Adding a new top-level module requires explicit justification. If a feature is close to an
existing module's domain, it becomes a slice inside that module instead.

## Repository layout

```text
plumbit-erp-fe/
│
├── src/
│   ├── app/                          routing only — thin segments, no business logic
│   │   ├── layout.tsx                root layout, providers
│   │   ├── (auth)/                   login/ forgot-password/ — unauthenticated shell
│   │   ├── (app)/                    authenticated shell: sidebar, topbar, tenant switcher
│   │   │   ├── layout.tsx
│   │   │   ├── customers/            implemented
│   │   │   ├── products/
│   │   │   ├── quotations/
│   │   │   ├── organization-settings/
│   │   │   └── (planned slices omitted from nav until the API exists)
│   │   └── api/                      route handlers — BFF only (auth cookie exchange, uploads)
│   │
│   ├── proxy.ts                      optimistic redirects only, never the auth boundary
│   │
│   ├── modules/                      one folder per top-level module, slices inside
│   │   ├── users-management/         auth/ users/ roles/ permissions/ tenants/
│   │   │                             organization-settings/ branches/ departments/ audit-logs/
│   │   ├── erp/
│   │   │   ├── quotations/  currencies/  exchange-rates/  suppliers/
│   │   │   ├── accounting/  taxes/ payment-terms/ terms-templates/ document-sequences/
│   │   │   ├── sales-orders/ sales-invoices/ credit-notes/ customer-payments/   (planned)
│   │   │   ├── purchase-orders/ purchase-invoices/ debit-notes/ supplier-payments/  (planned)
│   │   │   └── logistics/   (planned)
│   │   ├── inventory-management/     units/ categories/ products/ price-lists/ warehouses/
│   │   │                             stock (balances + movements list)/ stock-transfers/ stock-adjustments/
│   │   ├── crm/                      customers/ contacts/
│   │   │                             leads/ opportunities/ activities/  (planned)
│   │   ├── communication-service/    planned
│   │   └── notifications-service/    planned
│   │
│   ├── shared/                       shared building blocks — no module business logic
│   │   ├── api/                      client.ts envelope.ts errors.ts query-client.ts
│   │   ├── auth/                     session.ts permissions.ts use-crud-permissions.ts guards.tsx
│   │   ├── components/               ui/ (shadcn primitives) data-table/ form/ layout/ feedback/
│   │   ├── hooks/                    use-table-params.ts use-debounced-value.ts
│   │   ├── lib/                      format.ts cn.ts search-params.ts
│   │   ├── providers/                query-provider.tsx session-provider.tsx theme-provider.tsx
│   │   └── types/                    envelope.ts pagination.ts filters.ts
│   │
│   ├── config/                       env.ts navigation.ts constants.ts
│   └── integrations/                 third-party SDK wrappers — analytics/ error-reporting/ uploads/
│
├── e2e/                              Playwright specs for critical flows
├── public/
├── docs/                             administration-api-gaps.md (do not invent screens without an API)
│
├── .env.example  .gitignore  Dockerfile
├── next.config.ts  tsconfig.json  eslint.config.mjs  package.json  README.md
```

## Slice structure

A slice owns everything it needs to talk to its backend resource and render it. Slices live under
their module, never under `app/`.

```text
src/modules/crm/leads/
├── api.ts                the only place this slice performs HTTP
├── schemas.ts            Zod schemas and the types inferred from them
├── queries.ts            query keys and read hooks — useLeads, useLead
├── mutations.ts          write hooks and their cache invalidation
├── permissions.ts        the permission strings this slice needs
├── components/           leads-screen.tsx  leads-table.tsx  lead-form.tsx  lead-status-badge.tsx
└── hooks/                slice-specific UI hooks (only when a component cannot own it)
```

```text
src/modules/erp/
├── quotations/           api.ts schemas.ts queries.ts mutations.ts permissions.ts components/
├── sales-orders/         (same shape)
└── purchase-invoices/    (same shape)
```

Keep each slice self-contained. A slice that only has a table and a form does not need every
file — add `mutations.ts` when it writes, `hooks/` when a component genuinely cannot own the state.

## What belongs in `shared/` versus a module

`shared/` holds what more than one module genuinely needs: the API client and response-envelope
handling, the error-code mapping, the session and permission helpers, the design-system
primitives, the data-table and form wrappers, and the formatting utilities.

`shared/` must never contain module business logic or a domain-specific type. A `LeadStatusBadge`
belongs to `crm/leads`; a generic `StatusBadge` that takes a variant belongs to `shared/`. If
something in `shared/` only makes sense for one module, move it into that module.

When one module needs another's data, import the owning slice's query hook or API function. Never
duplicate its request or its Zod schema.

```text
Bad:   crm/customers/components fetches /api/v1/sales-orders directly
Good:  crm/customers/components uses useSalesOrders() from erp/sales-orders/queries
```

## Routing

Route segments under `app/` are a thin routing and composition layer. They map a URL to a feature
component, resolve the session, gate on permission, and optionally prefetch. Nothing else.

The URL mirrors the backend's flat resource surface, so a screen is easy to match to its endpoint:

```text
src/modules/crm/leads/                       →  /leads                →  /api/v1/leads
src/modules/erp/purchase-invoices/           →  /purchase-invoices    →  /api/v1/purchase-invoices
src/modules/inventory-management/products/   →  /products             →  /api/v1/products
src/modules/users-management/users/          →  /users                →  /api/v1/users
```

Module names do not appear in the URL. Route groups such as `(app)` and `(auth)` organise the
shell without adding a path segment. Because the URL space is flat, segments must be unique across
modules — name the route for what it is rather than prefixing it with the module:
`/customer-payments` and `/supplier-payments`, not `/sales/payments` and `/purchasing/payments`.

Every list route owns `loading.tsx` and `error.tsx` so a slow or failing request degrades into a
skeleton or a recoverable error state rather than a blank screen.

## Navigation registration

A screen is only reachable once it is registered in `src/config/navigation.ts`, together with the
permission that reveals it. Do not scatter sidebar links across layout components, and do not
hardcode a link that the current user may not be allowed to open.

```ts
// src/config/navigation.ts
{ label: "Leads", href: "/leads", icon: Users, permission: "crm.lead.read" }
```

Hiding a link is a usability decision, not a security one — the backend still enforces access.
Register nav **only** for slices with a live API. Feature-flag or omit unimplemented slices (same
rule as [administration-api-gaps.md](../../../docs/administration-api-gaps.md)).

## Render flow

```text
URL → Route Segment (server) → await session and tenant from httpOnly cookie
    → permission gate → optional server prefetch through the slice's api.ts
    → Feature Component → TanStack Query hook → slice api.ts → backend /api/v1
```

The route segment must NOT contain business logic, data shaping or `fetch` calls of its own.

## Route segment rules

A segment is responsible only for reading route params and search params, resolving session and
permission, choosing which feature component to render, and page metadata.

Do not do this:

```tsx
// app/(app)/leads/page.tsx
export default async function LeadsPage() {
  const res = await fetch(`${process.env.API_URL}/api/v1/leads`);
  const json = await res.json();
  // Filtering, totals and status rules do not belong here
  const active = json.data.filter((l) => l.status !== "lost");
  return <table>{/* ... */}</table>;
}
```

Do this instead:

```tsx
// app/(app)/leads/page.tsx
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("crm.lead.read");
  const filters = parseLeadFilters(await searchParams);

  return <LeadsScreen filters={filters} />;
}
```

`params` and `searchParams` are promises and must be awaited, as must `cookies()` and `headers()`.

## Component layer rules

Feature components own layout, interaction and presentation state. They read data through the
slice's query hooks and write through its mutation hooks — never by calling `fetch` themselves.

```tsx
// modules/crm/leads/components/leads-table.tsx
"use client";

export function LeadsTable({ filters }: { filters: LeadFilters }) {
  const { data, isLoading } = useLeads(filters);
  const { mutate: convert } = useConvertLead();
  // rendering, selection, dialogs
}
```

Split a component when it mixes concerns, not when it gets long. A container that resolves data
and passes it to presentational children is easier to read and reuse than one component holding
queries, table config, dialogs and form state at once.

Keep the client boundary as low in the tree as it will go. Mark the interactive leaf `"use client"`
rather than the whole page, so the shell, headers and static content stay server-rendered.

## Data layer rules

`api.ts` owns HTTP for the slice: the URL, the request shape, envelope unwrapping and response
validation. `queries.ts` and `mutations.ts` own caching: query keys, invalidation, optimistic
updates and retry behaviour.

Business rules never live in either. If a rule decides whether an action is legal — whether a
quotation can be approved, whether stock is sufficient — the backend decides and the front-end
reflects the answer.

```ts
// Bad — the front-end inventing a business rule
if (order.total > 50000 && !user.isManager) {
  throw new Error("Approval required");
}

// Good — the backend already told us
{order.available_actions.includes("approve") && <ApproveButton />}
```

Keep the field as the API returns it (`available_actions`). Do not compute the list from status.

## Schema rules

Every response is parsed through a Zod schema in the slice's `schemas.ts`, and types are inferred
from those schemas rather than declared twice.

```text
Form values → Zod schema → api.ts → backend
Backend response → Zod schema → inferred type → component props
```

Keep the variants separate and named for their role:

```text
LeadSchema  LeadCreateSchema  LeadUpdateSchema  LeadFiltersSchema  LeadFormSchema
```

An API response type is not a form type. Derive the form schema for what the form collects, and
map it to the request shape in `api.ts`.

## State ownership

```text
Server data              TanStack Query — the only cache for backend data
URL state                page, page_size, filters, sort, tab, selected id
Form state               react-hook-form with a Zod resolver
Ephemeral UI state       useState in the component that owns it
Cross-screen UI state    Zustand — sidebar, command palette, unsaved-changes guard
```

Command palette and keyboard shortcuts for list/document screens may use Zustand. Saved filters
live in the URL only — no second cache. Print/PDF is a backend job opened from the document
toolbar. Attachments use `identity.attachment.*`, not a new module.

Never copy server data into Zustand or `useState`, and never keep two sources of truth for the
same value. List parameters belong in the URL so a filtered view can be shared, bookmarked and
restored on reload.

## Dependency direction

```text
Route Segment → Feature Component → Query/Mutation Hook → api.ts → Backend
```

Modules may depend on `shared/` and on another module's slice API and hooks. Never allow
`shared/` to import from `modules/`, a component to call `fetch` directly, `api.ts` to import a
React component, or circular imports between slices.

## Naming conventions

| Thing                 | Convention               | Examples                                                                                       |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| Directories           | `kebab-case`             | `users-management`, `purchase-invoices`, `crm/leads`                                           |
| Files                 | `kebab-case`             | `api.ts`, `leads-table.tsx`, `use-table-params.ts`                                             |
| Components            | `PascalCase`             | `LeadsTable`, `QuotationForm`, `StockAdjustmentDialog`                                         |
| Hooks                 | `useCamelCase`           | `useLeads`, `useCreateQuotation`, `useTableParams`                                             |
| Types and Zod schemas | `PascalCase`             | `Lead`, `LeadFilters`, `LeadCreateSchema`                                                      |
| Routes                | hyphenated plural        | `/leads`, `/products`, `/sales-orders`, `/purchase-invoices`                                   |
| Query keys            | array, resource first    | `["leads", "list", filters]`, `["leads", "detail", id]`                                        |
| Permissions           | `module.resource.action` | `identity.user.read`, `erp.quotation.approve`, `inventory.stock.adjust`, `erp.einvoice.submit` |

One exported component per file, named the same as the file. Avoid `index.ts` barrels that
re-export a whole module — they defeat tree-shaking and hide the real dependency.

## Build order

When building the front-end from scratch, follow this order so the foundations exist before the
screens that need them:

```text
1. Project foundation (config, providers, API client)
2. Design system primitives and app shell
3. Auth, session and permission gating (identity.*)
4. Data-table, form and filter patterns
5. Tenant switching and navigation registry
6. CRM masters (customers, contacts)
7. Inventory masters (units, categories, products, warehouses)
8. ERP masters then quotations
9. Sales and purchase documents (SO, DN, INV, PO, GRN, bills, payments, credit/debit notes)
10. Accounting (COA, journals, AR, AP)
11. E-invoicing status UX (after posted invoices exist; never call an ASP from the browser)
12. communication-service, notifications-service, dashboards, reports, AI panels
```

## Definition of done for a new slice

- Slice contains its own `api.ts`, `schemas.ts`, query/mutation hooks, permissions and components.
- Route segment is thin; components render; hooks cache; `api.ts` is the only place doing HTTP.
- Route registered in `src/config/navigation.ts` with the permission that reveals it — only if the
  API exists.
- Workflow documents parse `available_actions`, `is_posted`, money fields and e-invoice status
  when the OpenAPI has them. Actions are not computed locally.
- Every response validated by a Zod schema; no `any` and no hand-written duplicate types.
- Actions and navigation gated on permissions, with the backend still enforcing them.
- New / View / Edit / Delete (and nested create) gated independently via `useCrudPermissions`;
  create-only users can create and view, not update. ERP/CRM masters use `/{resource}/{id}` and
  `/{resource}/{id}/edit`; create stays in the form dialog (and nested `MasterSelect`), except
  document `/new` where it already exists.
- List views wrap in `ListPage`, paginate with compact page numbers, and keep page, filters and
  sort in the URL. Toolbar: search + status (if the resource has one) + one primary filter;
  remaining OpenAPI list params go in `MoreFiltersDialog` (same layout as quotations and products).
- `loading.tsx` and `error.tsx` present, plus empty and no-access states inside the feature
  (four ERP screen states).
- Backend error codes mapped to user-facing messages including `PERIOD_LOCKED`,
  `INVENTORY_INSUFFICIENT_STOCK`, `DOCUMENT_STALE`, `EINVOICE_*`; no raw error text surfaced.
- Money and dates rendered through the shared formatters; no float arithmetic; no client VAT math.
- Forms validate with Zod, disable on submit, and surface field-level server errors.
- Keyboard and screen-reader accessible: labels, focus management, visible focus states.
- Types, lint and formatting pass, and a Playwright spec covers the flow if it is critical.
