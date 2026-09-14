# UX audit tracker

Living checklist for the plumbit-erp-fe UI overhaul. Shared-component changes are the default; per-page notes are only where something still needs a follow-up.

## Executive summary

The ERP already reused one design system and one set of list/document shells. This pass hardens those shared pieces so the ~167 routes pick up the same visual language as the Enterprise ERP CRM Foundation reference (brand `#3D5CDB`, 14px type, denser chrome) without changing business logic.

**Shipped in this pass**

- Semantic status tokens and a branded dark palette
- Record-aware breadcrumbs, Cmd+K page search, help shortcuts, persisted sidebar collapse, theme toggle
- Shared empty/error/loading states, status badges, filter chips, list-search clear, icon-button tooltips
- Dashboard KPI cards, related-documents/timeline polish, login card, dialog overflow on small screens

**Still follow-up (not blocking)**

- Per-list empty-state copy/icons are generic unless a screen already passed a title
- Global search covers navigation, not live record APIs
- Some report toolbars still use date inputs without extra helper text
- Notifications stay out of the header because there is no notifications API

## Phase status

| Phase                        | Status        | Notes                                                                     |
| ---------------------------- | ------------- | ------------------------------------------------------------------------- |
| 1 Design tokens + primitives | Done          | `globals.css`, badge/status tokens, empty/error/loading                   |
| 2 Navigation & layout        | Done          | Breadcrumb, command palette, help, theme, sidebar persist                 |
| Shared shells                | Done          | Data table, document/report shells, related docs, tracker                 |
| 3 Wave A (P0/P1)             | Inherited     | Dashboard + list/document screens via shared components                   |
| 3 Wave B–E                   | Inherited     | Same shared shells; no per-page forks                                     |
| 4 Cross-module workflow      | Done (visual) | Related documents + tracker status badges; workflow actions unchanged     |
| 5 Usability                  | Done          | Labels, tooltips, help, toast theme, search clear                         |
| 6 Responsive + a11y          | Done          | Dialog max-height, header wrap, skip link, focus rings, 32px icon buttons |
| 7 QA                         | Done          | typecheck passed; changed files lint-clean; login + dashboard + customers + Cmd+K + dark class verified |

## Per-page checklist (how it is covered)

| Check                         | Where it lands                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| Purpose / title               | `PageHeader` / `RecordPageHeader`                                 |
| Primary action                | Existing New/Edit/workflow buttons; header wraps on small screens |
| Filters + Clear               | Existing list toolbars; search clear on `ListSearch`              |
| Table formatting / long text  | `RecordLink` truncates; tables still scroll horizontally          |
| Empty / loading / error       | `EmptyState`, `PageLoadingState`, `ErrorState`                    |
| Forms / required / validation | Unchanged logic; form errors no longer truncate                   |
| Modals on small screens       | Dialog/alert max-height + overflow                                |
| Destructive warnings          | Existing `ConfirmActionDialog`                                    |
| Keyboard / aria               | Cmd+K, skip link, icon `aria-label` + `title`                     |

## Module notes

- **Overview / Dashboard** — KPI cards with icons and links; empty access state; unposted counts as badges
- **CRM, Sales, Purchases, Payments** — list + document shells inherit breadcrumbs, search, badges
- **Shipments / Inventory / Accounting / Masters / Reports / Admin** — same; Help & Support now opens shortcuts instead of a dead label
- **Auth** — login (and other auth pages) sit in a card; organization/email/password flow unchanged

## QA notes

- Login (Plumb IT Test / admin@plumbit.com), dashboard KPIs, customers list/record breadcrumbs, Cmd+K page search, and dark class on `<html>` were verified in the browser.
- `next.config.ts` allows `192.168.29.225` as a dev origin — restart `next dev` if LAN login still fails to load `/_next` chunks.
- `npm run test` currently fails in this repo (Vitest 3 + Vite 7 ESM config). New unit tests were added but not executed.
- Full `npm run lint` still reports pre-existing `react-hooks/set-state-in-effect` errors in payment/landed-cost dialogs; files touched in this pass lint clean.
