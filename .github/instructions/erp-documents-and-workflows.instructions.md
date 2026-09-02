---
description: ERP document UX — save vs post, available_actions, period lock, negative stock, VAT display, e-invoicing status, jobs and AI confirmation.
applyTo: "src/modules/erp/**,src/modules/inventory-management/**,src/modules/users-management/organization-settings/**"
---

# ERP Documents and Workflows

Front-end counterpart to backend domain sections 10–21. Apply when building quotations, orders,
invoices, credit/debit notes, payments, GRN, delivery notes, stock screens, or organization
settings that expose operational / e-invoicing fields.

The backend is the source of truth. This file is about **how to present** posting, lock, stock,
VAT and e-invoicing — not how to reimplement them.

Quotation workflow buttons that compute transitions from a local status table
(`quotation-workflow-buttons.tsx` + `quotations/workflow.ts`) are the **anti-pattern**. Do not
repeat it. New documents render `document.available_actions` only. When quotations gain that
field, delete the local table.

## Save vs Post

- **Save** keeps `DRAFT`. It does not move stock, AR/AP, tax or GL.
- **Confirm / Post** is a named, permissioned action (`POST /{resource}/{id}/post`). It is never
  a side effect of the save mutation.
- The confirmation copy must state that stock, AR/AP and tax will move — not “Are you sure?”.
- Disable Post while the mutation is in flight. Send `Idempotency-Key` on post, payment,
  stock-movement and e-invoice submit.
- Do not offer Post on a document whose `available_actions` omit it.

## Actions

- Render `document.available_actions` only. Gate each action on its permission.
- Never a local `STATUS → buttons` map.
- Destructive or irreversible actions (post, void, cancel, submit e-invoice) use the shared
  confirm dialog and name the document number.
- Clone / credit-note / debit-note / reversal appear only when the API lists that action.

## Posted records

- No edit or delete on `is_posted` / `POSTED` records, and none on `einvoice_status === exchanged`.
- Offer Credit note / Debit note / Reversal when `available_actions` includes it.
- Do not PATCH posted amounts. Navigate to `/credit-notes/new?source_id=` (or whatever the API
  documents) instead of unlocking the form.

## Period lock

- On `PERIOD_LOCKED`, disable dated fields and writes. Show the lock date from error `details`
  (`lock_date`, `hard_lock_date`, `document_date`).
- Do not let the UI invent a lock, compare dates locally, or hide the error.
- Period-close controls in Organization Settings exist only after the tenant API exposes
  `lock_date` / `hard_lock_date`. Do not mock them.

## Negative stock

- Surface `INVENTORY_INSUFFICIENT_STOCK` with backend `details` (warehouse, available qty,
  requested qty). Do not guess warehouse names.
- Warehouse screens show negative on-hand when the tenant allows it.
- Period-close UI shows `PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK` and why the lock was refused.
- `allow_negative_stock` is a tenant column. Show a control only after `GET /tenants/current`
  includes it — same pattern as [administration-api-gaps.md](../../../docs/administration-api-gaps.md).

## Tenant operational settings

Organization Settings may expose, **only after OpenAPI has them**:

```text
allow_negative_stock    lock_date    hard_lock_date
einvoicing_required     asp_provider (id, not secrets)
peppol_participant_id   tin          digital identity
```

Do not mock lock dates, negative-stock toggles, ledger figures, ASP keys or Peppol IDs. Changing
locks is permissioned (`erp.period.lock` or `identity.organization.update`); changing ASP
credentials is never done from the browser.

## Money and UAE VAT display

- Totals, tax and exchange come from the backend. Never recalculate VAT, tax or FX in the
  browser.
- Show currency, tax treatment, place of supply (emirate), and TRN when present.
- Historical documents use the stored `exchange_rate`. On `EXCHANGE_RATE_MISSING`, show the
  mapped error — do not interpolate a rate.
- Line-item tax category (`STANDARD` / `ZERO_RATED` / `EXEMPT` / `OUT_OF_SCOPE`) is display and
  payload passthrough, not a client formula.

## Line-item pattern

Reuse the quotation keyboard grid: tab through cells, add a row from the last field, delete
without the mouse. The totals panel is **display-only**.

When discount or extra charge is non-zero, require an allowance/charge **reason code** (PINT-AE).
Do not invent codes; bind to the API enum when it exists.

Units: show UQC when the inventory unit API adds it. Do not mock a Peppol UOM list.

## Jobs

Import, export, PDF print, and e-invoice submit **start a job and poll**. Never parse a
spreadsheet in the browser to pre-validate, never generate PINT-AE XML, never call Zoho/Tally
from the client. Print/PDF opens from the document toolbar after the job completes.

Attachments use the existing `identity.attachment.*` slice, not a new module.

## E-invoicing

Plumbit posts locally. An MoF-accredited ASP exchanges PINT-AE. Zoho and Tally are optional
providers, not the ledger.

- Badge from `einvoice_status`: `not_required` | `pending` | `submitted` | `exchanged` |
  `rejected` | `failed`.
- Submit / retry only if `available_actions` includes `submit_einvoice`.
- Exchanged documents stay read-only.
- Rejection shows `asp_error_message` and the credit-note path. Do not unlock the invoice.
- Organization Settings: choose ASP **provider id**, show Peppol ID / TIN from the tenant API.
  Never type secrets. Never `NEXT_PUBLIC_` ASP keys.
- Party forms (customer/supplier): TIN, Peppol ID, free-zone, digital identity — after OpenAPI
  has them; do not mock.
- When `einvoicing_required` is true, hide Send / PDF-to-customer until `exchanged` if the API
  omits those actions.
- Map `EINVOICE_NOT_READY`, `EINVOICE_REJECTED`, `EINVOICE_ASP_UNAVAILABLE`,
  `EINVOICE_ALREADY_EXCHANGED`.
- Pending older than the SLA is a list filter / banner, not a client timer that submits.

## Stale document

On `DOCUMENT_STALE` / 409, refetch the document and block the write. Do not retry PATCH with
the stale `version`. Send `If-Match` / `version` on PATCH and post when the API requires it.

## AI panels

Label recommendations. Confirm writes through the normal mutation (the same Post / Save the
user would click). AI must not auto-post, auto-submit e-invoices, or set lock dates.

## Four screen states

Every document and stock screen still handles loading, empty, error and no-access. Posted /
locked / insufficient-stock / e-invoice-rejected are **additional** banners on top of those,
driven by API fields and error codes — not a second client state machine.
