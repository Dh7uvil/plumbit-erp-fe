---
description: Boundaries that must not be crossed — session and tenant handling, permissions as UX, module ownership, providers, money, posting, lock/stock, VAT, e-invoicing and AI rules.
applyTo: "src/**"
---

# Front-end Domain Boundaries

This is a multi-tenant UAE trading ERP client for a modular backend. The boundaries below keep
tenant data separated, keep financial figures trustworthy, and keep a module extractable later.
Convenience never outranks them.

Document posting, lock, stock, VAT and e-invoicing UX:
[erp-documents-and-workflows](erp-documents-and-workflows.instructions.md). Do not mock settings
the tenant API does not expose ([administration-api-gaps.md](../../../docs/administration-api-gaps.md)).

## Architecture principles

Modular front-end mirroring the backend's domain modules; App Router with server components by
default and client components only where interaction requires them; TypeScript in strict mode with
runtime validation at the network boundary; server data owned exclusively by TanStack Query;
permissions treated as presentation, never as enforcement; the backend as the single source of
business truth; URL as the source of truth for view state; accessible, keyboard-operable UI; and a
design system rather than ad-hoc styling.

---

## 1. The trust boundary

The most important rule in this repository: **the front-end enforces nothing.**

Everything the client does — hiding a button, disabling a field, gating a route, filtering a list —
is a usability affordance. A user who edits memory, replays a request or crafts a URL must be
stopped by the backend, and the front-end must be written on the assumption that they will try.

```text
Front-end permission check  →  better UX
Backend permission check    →  security
```

This also means the client never re-derives a decision the backend already made. If the backend
says an action is unavailable, the UI hides it; the UI does not compute its own answer and disagree.

## 2. The session boundary

The access token lives in an httpOnly, `Secure`, `SameSite` cookie set by a route handler. Client
JavaScript never reads it.

```text
Login → route handler → backend /api/v1/auth/login → httpOnly cookie
Request → cookie sent automatically → backend validates
401 → one deduplicated refresh → retry once → otherwise redirect to login
```

Never store an access or refresh token in `localStorage`, `sessionStorage`, a Zustand store, a
non-httpOnly cookie, a URL parameter or a global variable. Never put a token or a password in a log
line, an analytics event or an error report.

`proxy.ts` runs on the Node.js runtime and is for optimistic redirects only — sending an
unauthenticated visitor to `/login` before rendering the shell. It is not an authorization
boundary, and it must never be the only thing standing between a user and protected data. The
authoritative check happens in the server component or route handler that loads the data, and
ultimately in the backend.

Sensitive screens are dynamic, never statically cached, and the session is read with `await
cookies()` in the segment that needs it.

## 3. The tenant boundary

The tenant comes from the authenticated session, not from the client.

```text
Authenticated User → Session → Tenant Context
```

Never send `tenant_id` in a request body, query parameter or header as a way of selecting a tenant.
Tenant switching is a backend operation that reissues the session; the front-end reflects the
result.

The tenant is part of cache identity. On tenant switch and on logout, clear the TanStack Query
cache, reset any client stores holding tenant-derived state, and discard cached route data. Data
belonging to one tenant must never be visible for a moment under another — an uncleared cache is a
data-leak bug, not a stale-UI annoyance.

Never cache tenant-scoped or user-scoped data in a shared server-side cache. A `"use cache"`
boundary, an ISR page or a module-level variable that holds one tenant's rows will serve them to
the next tenant that asks.

```text
Bad:   module-level `let cachedCustomers` in an api.ts
Bad:   a cached component rendering the current tenant's dashboard figures
Good:  per-request server client, per-tenant query keys, dynamic rendering
```

## 4. The authorization boundary

Permissions are formatted `<module>.<resource>.<action>`, matching the backend exactly:

```text
identity.user.read          identity.role.update       identity.organization.update
identity.attachment.read    erp.quotation.approve      erp.period.lock
crm.customer.create         inventory.stock.adjust     erp.sales_order.create
crm.customer.update         inventory.product.read     erp.purchase_invoice.approve
crm.lead.read               inventory.stock.read       erp.journal_entry.post
erp.einvoice.submit         erp.einvoice.read          erp.credit_note.create
```

Do not invent `users.role.assign`. Catalog and session permissions are `identity.*` / `crm.*` /
`inventory.*` / `erp.*`.

Permissions come from the session and are checked through the shared helpers in
`src/shared/auth/permissions.ts`. Never hardcode a role name in a component — check the permission,
not the role, so a re-bundled role does not require a UI change.

```tsx
// Bad — role hardcoded, and the label is a lie if the role changes
{
  user.role === "Sales Manager" && <ApproveButton />;
}

// Good
{
  can("erp.quotation.approve") && <ApproveButton />;
}
```

Gate consistently at three levels: the navigation entry, the route segment, and the individual
action. A route the user cannot open should render a clear "no access" state rather than an empty
screen, and an action they cannot perform should be absent — not present and failing on click.

Create, read, update and delete are independent UX affordances. Having `*.create` does not unlock
Edit or Save on an existing record.

Use `useCrudPermissions` (`src/shared/auth/use-crud-permissions.ts`) for standard CRUD. Keep `can()`
for extra actions (approve, deactivate, clone, upload). Hide the control when the permission is
missing. View-only forms disable fields and omit Save.

- **Create:** New / nested `MasterSelect` + only if `*.create`.
- **Update:** Edit / enabled form / Save only if `*.update`.
- **View:** ERP/CRM masters use `/{resource}/{id}` (form `disabled`) and `/{resource}/{id}/edit`
  when `*.update`. List Eye / first two columns go to view; pencil goes to edit. Create stays in
  the form dialog (and nested `MasterSelect`). Exchange rates stay dialog-based (no GET `/{id}`).
  Administration lists may still use view/edit dialogs.
- **Delete:** show Delete (with confirmation) only if `*.delete`.
- Empty states must not invite create without `*.create`.
- Omit the Actions column when no row actions remain.

## 5. Module ownership

Each module owns its slices, its API calls, its schemas, its query keys and its components.

```text
users-management        Identity (BE: app/auth/): Auth, Users, Roles, Permissions,
                        Tenants/org-settings, Branches, Departments, Employees (nested),
                        Audit Logs. Attachments via identity.attachment.*.
                        Planned: tenant operational settings (allow_negative_stock, lock dates).
erp                     Implemented: Quotations, Currencies, Exchange Rates, Taxes,
                        Payment Terms, Terms Templates, Document Sequences, Suppliers.
                        Planned: Sales Orders, Sales Invoices, Credit Notes, Customer Payments,
                        Purchase Orders, Purchase Invoices, Debit Notes, Supplier Payments,
                        Accounting (Accounts, Journals, Receivables, Payables),
                        Logistics (Imports, Exports, Shipments, Containers),
                        e-invoicing status UX on sales invoices and credit notes.
inventory-management    Implemented: Units, Categories, Products, Price Lists, Warehouses.
                        Planned: Stock, Transfers, Adjustments, GRN, Delivery Notes, Sales Returns.
crm                     Implemented: Customers, Contacts.
                        Planned: Leads, Opportunities, Activities.
communication-service   Email, WhatsApp, Chat, Meetings (planned)
notifications-service   In-App, Email, WhatsApp and Push notifications, templates, delivery status (planned)
```

A module never re-implements another module's request or type. It imports the owning slice's query
hook or API function:

```text
Bad:   CRM component → fetch("/api/v1/products")
Bad:   CRM component → its own ProductSchema copy
Good:  CRM component → useProducts() from inventory-management/products/queries
```

Shared code goes in `src/shared/` only when more than one module genuinely needs it, and
`src/shared/` never holds module business logic or a domain-specific type. Two modules needing the
same domain concept is a signal that one of them owns it and the other should import it.

## 6. Cross-module screens

When a screen spans modules — a dashboard, a customer page showing orders and invoices — compose it
from each module's hooks in a container that lives in the module owning the screen. Do not create a
"dashboard" grab-bag module that reaches into other modules' internals, and do not promote the
composition into `src/shared/`.

## 7. Third-party providers

Third-party SDKs live behind a wrapper in `src/integrations/`:

```text
integrations/
├── analytics/  ├── error-reporting/  ├── uploads/
├── maps/       └── realtime/
```

Never import a vendor SDK directly into a feature component. A wrapper keeps the vendor swappable,
keeps its configuration in one place, and gives one point at which to strip sensitive fields before
anything leaves the browser.

```text
Bad:   modules/crm/leads/components → Sentry SDK
Good:  modules/crm/leads/components → integrations/error-reporting
```

Anything that talks to WhatsApp, email, payments, storage or an e-invoicing ASP is the
backend's job. The front-end calls our API; it does not hold a provider credential, and a
provider key must never reach the browser bundle. Never treat Zoho, Tally, or any ASP as the
source of accounting truth. Never send a draft or a browser-built XML to an e-invoicing provider.

## 8. Notifications and communication

`notifications-service` owns the notification surface: the bell, the unread count, the list, and
delivery status (`pending`, `queued`, `sent`, `delivered`, `failed`, `read`).
`communication-service` owns user-to-user communication — email threads, WhatsApp conversations,
chat and meetings.

A business module never renders its own bespoke notification tray or sends a message itself. It
triggers the backend action and lets `notifications-service` present the outcome.

## 9. Long-running work

Long-running operations belong to the backend's job pipeline. The front-end starts a job, then
tracks it — it does not do the work in the browser.

```text
User action → API creates job → UI shows job status → poll or subscribe → notify on completion
```

This covers Excel and CSV imports and exports, large report generation, PDF/print, bulk updates,
AI forecasting and e-invoice submit/poll. Never block the UI thread on a large computation, never
parse a large spreadsheet in the browser to "pre-validate" it, never generate PINT-AE XML, never
call Zoho/Tally from the browser, and never hold a request open waiting for a job to finish.
Uploads show progress, support cancellation, and validate size and type before sending.

## 10. Money and figures

The backend computes money. The front-end formats it.

Money arrives as a precise decimal string and must not be turned into a `number` for arithmetic —
JavaScript floats silently corrupt currency values. Display through the shared formatter; when a
figure must be summed, take the total the backend already provides.

```ts
// Bad
const total = items.reduce((sum, i) => sum + parseFloat(i.amount), 0);

// Good
const total = order.total_amount; // computed and rounded by the backend
```

Every monetary value is rendered with its currency — never a bare number. Where a document carries
both, show the transaction currency and the base currency, using the `exchange_rate` stored on that
document. Never recompute a historical document's base amount from today's rate, and never
substitute a different day's rate when one is missing — surface the backend's error instead.

Exchange rates are entered by users through the `erp/exchange-rates` slice, not fetched from a
provider. The rate form is a normal ERP form: it records the rate for a currency pair on a date,
and the UI never guesses or interpolates a missing rate.

Percentages, quantities and tax figures follow the same rule — display what the backend calculated
rather than recalculating a total the user might compare against an invoice. Never recalculate VAT,
tax or exchange in the browser. Show tax treatment, place of supply (emirate) and TRN when the
document carries them. On `EXCHANGE_RATE_MISSING` or `PERIOD_LOCKED`, surface the mapped error;
do not invent a rate or a lock date.

## 11. Workflow status

Status transitions are decided by the backend and validated against its state machine. The UI
renders `document.available_actions` only — never a local `STATUS → buttons` table (quotation
workflow helpers are the anti-pattern to stop repeating).

```text
DRAFT  →  POSTED (local ledger)  →  einvoice pending  →  exchanged
                                              ↘ rejected → credit note
```

Never hardcode a transition table in the front-end and never offer an action because the status
string looks right. Gate each action on permission, and surface `INVALID_STATUS_TRANSITION` or
`DOCUMENT_STALE` as a clear message if the state changed underneath the user.

Save keeps `DRAFT`. Confirm/Post is a named action with confirmation that stock, AR/AP and tax
will move. Posted and e-invoice-`exchanged` records are read-only; offer Credit note / Debit note
/ Reversal when the API lists that action.

Destructive or irreversible actions — approving, posting, cancelling, voiding, deleting, submitting
an e-invoice — require an explicit confirmation that names what will happen, and they are disabled
while in flight.

On `PERIOD_LOCKED`, disable dated writes and show the lock date from error `details`. On
`INVENTORY_INSUFFICIENT_STOCK`, show warehouse and qty from `details`. Do not mock
`allow_negative_stock` or lock dates — wait for the tenant API (see
[erp-documents-and-workflows](erp-documents-and-workflows.instructions.md)).

## 12. Documents and identifiers

Document numbers (`QUO-2026-000001`, `SO-2026-000001`, `INV-2026-000001`, `CN-…`, `GRN-…`,
`BILL-…`, `SDN-…`) are generated by the backend. The front-end never generates, guesses, predicts
or displays a provisional number for an unsaved document. Entity IDs are opaque UUIDs — do not
parse them, sort by them or infer order from them.

Posted financial records are read-only. The UI must not present an edit affordance for one; offer
the correction path the backend supports — reversal, credit note, debit note or adjustment — and
only when `available_actions` includes it. An e-invoice `exchanged` document is as immutable as
posted. Rejection does not unlock the row; offer the credit-note path.

## 13. AI boundary

AI output is a suggestion until a user accepts it.

```text
AI Forecast → Recommendation → User Review → Approval → ERP Action
```

An AI panel may recommend reorder quantities, expected demand, potential stock shortages, shipment
projections and sales forecasts, and it must be visibly labelled as a recommendation with its
confidence or basis where available. It must never auto-submit a purchase order, change stock,
approve a payment, post an accounting entry, submit an e-invoice, set a lock date or delete a
record.

Never send ERP data to an AI provider from the browser. AI calls go through the backend, and the
front-end only renders what comes back.

## 14. Dependency direction

```text
Route Segment → Feature Component → Query/Mutation Hook → api.ts → Backend
```

Allowed: any module may depend on `src/shared/` and on another module's slice API and hooks.

Forbidden: `src/shared/` importing from `src/modules/`, a component calling `fetch` directly,
`api.ts` importing a React component, business rules living in components or hooks, a vendor SDK
imported outside `src/integrations/`, and circular imports between slices.
