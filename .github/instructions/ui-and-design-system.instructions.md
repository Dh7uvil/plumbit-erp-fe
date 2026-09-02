---
description: Design system usage, component layering, data tables, forms and validation, ERP display conventions, accessibility and styling rules.
applyTo: "src/shared/components/**,src/modules/**/components/**,src/app/**,src/styles/**,tailwind.config.ts"
---

# UI and Design System

An ERP is used all day by people who know it well. Density, consistency and keyboard efficiency
matter more than novelty. A screen that behaves like every other screen is a feature.

## Component layering

```text
shared/components/ui/          shadcn/ui primitives — button, input, dialog, select, table
shared/components/data-table/  the table pattern: columns, toolbar, pagination, empty states
shared/components/form/        form field wrappers bound to react-hook-form
shared/components/layout/      page shell, section, toolbar, sidebar, breadcrumbs
shared/components/feedback/    skeletons, empty states, error states, confirmations
modules/<module>/<slice>/components/   the feature's own screens, tables, forms and badges
```

Primitives are generic and domain-free. Anything that names a domain concept — `LeadStatusBadge`,
`QuotationTotalsPanel` — belongs to its slice. A generic `StatusBadge` taking a variant belongs in
`shared/`.

Do not fork a primitive to change one thing. Extend it through props or variants so every screen
inherits the fix. Do not wrap a primitive in a near-identical component that only adds a class.

Clickable controls in `src/shared/components/` must include `cursor-pointer` (keep
`disabled:cursor-not-allowed` / `disabled:pointer-events-none` where they already exist). Do not
sprinkle `cursor-pointer` on feature `Button`s — inherit it from the primitive.

## Using shadcn/ui

Primitives are generated into the repository and owned by us, so they may be edited — but edit them
deliberately, in `shared/components/ui/`, so the change lands everywhere. Do not copy a primitive
into a feature folder to tweak it.

Keep the Radix behaviour intact when editing: the accessible label, focus trap, escape handling and
`aria` wiring are the reason to use the primitive at all.

## Styling

Tailwind utilities in the markup are the default. There are no `.css` files per component, no CSS-in-JS
and no inline `style` objects except for genuinely computed values such as a chart dimension.

Design tokens — colour, spacing, radius, typography — come from the Tailwind theme and CSS variables.
Never hardcode a hex colour, a magic pixel value or a raw font size in a component.

```tsx
// Bad
<div className="text-[#1f2937] p-[13px]" style={{ fontSize: 13 }}>

// Good
<div className="text-foreground p-3 text-sm">
```

Compose conditional classes with the shared `cn` helper rather than template strings, so conflicting
utilities resolve predictably. Support dark mode through tokens, never by branching on a theme value
in component logic.

Layouts are responsive and built with flex and grid. ERP tables are wide by nature: give them
horizontal scroll with sticky headers and a sensible column priority on small screens rather than
letting the page break.

## Data tables

Lists are the heart of this application, so they follow one pattern from `shared/components/data-table/`:
server-side pagination, sorting and filtering, a toolbar with search and filters, column visibility,
row selection where bulk actions exist, and explicit loading, empty and error states.

List-toolbar dropdowns use `FilterSelect`, not shadcn `Select`. `FilterSelect` is searchable, has no
create action, and skips react-hook-form `FormControl` so it can live outside a `FormField`. Form
enum fields, login/forgot-password tenant pickers, and in-row editors stay on shadcn `Select` or
`MasterSelect`.

```text
Toolbar     search, filters, column visibility, primary action
Header      sortable columns limited to what the backend allows
Body        skeleton rows while loading, never a spinner replacing the whole table
Footer      compact numbered pages with ellipsis, Previous/Next, total from the response meta
Empty       explains why it is empty and offers the next action
```

Pagination, sort and filters live in the URL, and the table reads `total` from the response `meta`.
Never load every row to sort or filter in the browser, and never present a partially loaded result as
the complete set.

Columns are defined in the slice, typed against the row type, and never `any`. Keep cell renderers
declarative — a cell formats and links; it does not fetch, mutate or compute a business rule. Long
lists are virtualised.

Row actions use the shared cluster in `shared/components/data-table/row-actions.tsx`. For ERP and
CRM masters (and quotations), Eye / Edit / Delete map to `viewHref` (`/{resource}/{id}`), `editHref`
(`/{resource}/{id}/edit` when `*.update`), and `onDelete` (confirm when `*.delete` and the API has
DELETE). The first two data columns use `RecordLink` to the view page (`cursor-pointer hover:underline`).
Exchange rates keep `onView` / `onEdit` dialogs (no GET `/{id}`); their first two columns open the
view dialog. Extra actions (clone) sit after Edit. Quotations have no trash. Administration lists
may still use view/edit dialogs. Destructive actions still require confirmation and are disabled
while a mutation is in flight. Omit the Actions column when nothing would render.

Empty toolbar and empty-state copy must not say “Create a X…” when the user cannot create.

## Forms

Forms use react-hook-form with a Zod resolver and the field wrappers in `shared/components/form/`.
Validation lives in the slice's schema, so the same rules type the form and the request.

```tsx
const form = useForm<QuotationFormValues>({
  resolver: zodResolver(QuotationFormSchema),
  defaultValues,
});
```

The form schema describes what the form collects — it is not the API response type. Map form values
to the request shape in `api.ts` rather than shaping them in the submit handler.

Layout every ERP form and modal the same way (skip auth screens). Do not wrap a
primitive just to add a grid class — put the grid on the form markup.

```text
Compact            short text, codes, numbers, enums, MasterSelect — share a row
Wide               textarea / notes / terms / descriptions / long body: col-span-full
                   (not lg:col-span-3, which is wrong when the grid is only 2 columns)
Checkboxes         full row (col-span-full)
Fill the row       do not leave an empty column at the grid's column count.
                   Do not full-span a compact field.
2-col grid         grid grid-cols-1 gap-3 sm:grid-cols-2
                   when the natural pairing is two compact fields
3-col grid         … sm:grid-cols-2 lg:grid-cols-3
                   when a row has three compact fields, or the dialog is already
                   sm:max-w-3xl / sm:max-w-4xl
Last row of two    in a 3-col grid, wrap the pair in
                   col-span-full grid sm:grid-cols-2 gap-3 so they fill
Conditional        when a compact sibling hides, the remaining field spans the row
                   (e.g. Name spans 2 when type is not PERCENT)
Dialogs            tiny dialogs stay sm:max-w-lg / sm:max-w-xl; bump width only if
                   three short fields feel cramped. Large forms use
                   sm:max-w-3xl / sm:max-w-4xl
Section titles     text-sm font-medium, outside the field grid; address blocks
                   only (Billing address, Shipping address, Headquarters). Do
                   not add Identity / Commercial / Notes / Employee titles.
```

`AddressFields` owns its nested grids: two columns of compact textareas for address lines, then a
3-column row for city, state, country, country code and postal code. Do not rely on the parent grid
for that layout. Customer and supplier billing/shipping use `BillingShippingFields`: keep those
two titles. Put **Same as billing address** on the right of the Shipping address title. It is
form-only (not in the API) and defaults to unchecked on create and edit. When checked, copy
billing into shipping, disable shipping, and keep them in sync. Submit still sends both addresses.

Customer and supplier **create** omit Code — the backend generates it. Do not send `code`
on POST. Edit and view show the generated code on the right of the dialog or card title as
`Supplier ID : 001`, not as a disabled input in the grid and not as a stray line above the fields.
The page header shows the record name and the raw code on the same line (no `Supplier ID :` prefix).
After Code leaves the row, field order is Name, Type, then Contact.

Customer and supplier always have Contact after Type (3-col when Contact is shown).
**Create** collects optional Contact name, then Email and Phone on the next row. If email or
phone is filled, name is required. After the party is created, `POST /contacts` with
`is_primary: true` and the new party id. Do not invent a nested contact on the party payload —
the OpenAPI schema has no such field. If the contact call fails, keep the party, toast that the
company was created but the contact was not, and leave the dialog open. **Edit** shows a
`MasterSelect` of that party's contacts (create still nested); changing it sets `is_primary`.
Extra contacts stay on the detail `ContactsPanel` (row actions and the first two columns go to
`/contacts/{id}`). The contact create dialog keeps `sm:max-w-lg`, a 2-col grid, Company / Name /
Email / Phone each on their own row, and Primary contact + Active on one 2-col row (Primary spans
the row on create).

User-typed master codes (currency, unit, category, warehouse, branch, department) stay as Code
inputs on create. On edit they use the same `{Entity} ID : 001` title treatment; do not send `code` on
PATCH. Employee code on the user form stays a normal input.

Master-table lookups (currency, tax, unit, category, payment terms, price list, terms template,
branch, customer, supplier/company, contact, product) use `MasterSelect`: searchable select plus a
permission-gated create (`*.create` on the **target** resource). After create, set the field to the
new id. Nested create dialogs stack above the parent (`DialogContent nested`, overlay/content
`z-[60]`); Escape closes the inner dialog only. Do not add create on users/salesperson, roles,
tenants, or login tenant pickers.

Create stays in the form dialog (and nested `MasterSelect`). ERP/CRM master view and edit use
dedicated `/{resource}/{id}` and `/{resource}/{id}/edit` pages, not view/edit dialogs. Exchange
rates are the exception (dialogs; no GET `/{id}`). Document create uses `/new` where it already
exists (quotations). Administration dialogs may still self-derive create vs view vs edit from slice
permissions via `useCrudPermissions`. Create does not unlock edit. View-only forms disable fields
and omit Save. See
[frontend-domain-boundaries](frontend-domain-boundaries.instructions.md) section 4.

Behaviour every form gets:

```text
Labels bound to inputs, with required state indicated
Inline field errors, and server field errors attached to their fields
Submit disabled while in flight, with a visible pending state
No double submit, and no duplicate document on a double click
Unsaved-changes warning before navigating away
Focus moved to the first invalid field on failed validation
```

Client validation is for immediate feedback. The backend validates again, and its `VALIDATION_ERROR`
details are mapped onto the matching fields; anything unmatched goes to a form-level message.

Never validate a business rule the front-end cannot know — credit limits, stock availability,
duplicate document numbers, whether an approval is allowed. Send the request and present the answer.

Large ERP forms are split into sections or steps with a persistent summary, and line-item editors
support keyboard entry: tab through cells, add a row from the last field, delete without reaching for
the mouse.

## Displaying ERP data

```text
Money        shared formatter, always with currency, right-aligned, never a bare number
Quantities   right-aligned with unit of measure, precision as the backend returns it
Dates        shared formatter, locale-aware, absolute for records; relative only for activity feeds
Status       badge with a consistent colour per status across every screen
Documents    monospace document number, linked to the record
IDs          not shown unless a user needs them; never a raw UUID in a busy column
Empty value  an explicit dash, never a blank cell or "null"
```

Never do arithmetic on money in a component. Totals come from the backend; the UI displays them.
Never recalculate VAT, tax or exchange in the browser. Show tax treatment, place of supply and
currency together on the document header.

Timestamps arrive in UTC and are rendered in the user's timezone at display time only. Show the
timezone where ambiguity matters, such as an audit trail or a scheduled action.

Status colour is defined once per status and reused, so `approved` never looks different between
quotations and invoices.

## Feedback and state

```text
Loading    skeletons matching the layout; spinners only for small inline actions
Success    toast for a background result; inline confirmation where the user is looking
Error      mapped message, the retry or correction path, never a stack trace
Empty      what this list is, why it is empty, and the action to fill it
No access  a clear message, not an empty table
```

Optimistic UI is for cheap reversible interactions only. Money, stock, posting, approval and
e-invoice submit always wait for the server.

Confirmations name the consequence — "Post invoice INV-2026-000123? Stock, AR and tax will move."
or "Void invoice INV-2026-000123?" — rather than asking "Are you sure?", and the confirming button
carries the verb.

Document screens use one layout: header (number, status, e-invoice badge) + lines (keyboard grid)
+ totals (display-only) + attachments (`identity.attachment.*`) + activity. Lock and insufficient-
stock errors are banners with backend `details`, not toast-only. Period-lock and negative-stock
banners belong on dated documents and warehouse screens.

## Accessibility

Accessibility is part of the deliverable, not a later pass.

```text
Every input has a real label            Dialogs trap focus and restore it on close
Icon-only buttons have accessible names Escape closes, Enter submits
Visible focus states, never removed     Errors announced, not colour-only
Full keyboard operation of every flow   Semantic elements over div soup
Contrast meets WCAG AA                  Tables use proper header semantics
```

A flow that cannot be completed with a keyboard is incomplete. Anything conveyed by colour — status,
validity, a negative figure — is also conveyed by text or icon.

## Text and copy

Interface strings live with the component that shows them, error messages come from the shared
error-code map, and copy is written plainly: a message says what happened and what to do next. Keep
strings out of business logic and avoid concatenating sentences from fragments, which breaks the
moment the app is translated. Do not add Arabic/RTL until a product decision exists.

## UI review checklist

- Primitives reused; no forked or near-duplicate component.
- No hardcoded colours, spacing or font sizes; tokens and utilities only.
- Table uses the shared pattern with server-side pagination, sorting and filtering.
- List-toolbar dropdowns use `FilterSelect`, not shadcn `Select`.
- Loading, empty, error and no-access states all present.
- Form uses react-hook-form with the slice's Zod schema; server field errors mapped.
- Submit disabled while pending; destructive actions confirmed and named.
- Money, dates and quantities rendered through shared formatters with currency and units.
- VAT / tax / place of supply displayed from the document; not recomputed.
- Document header + lines + totals + attachments + activity where the slice is a voucher.
- Posting confirmation names stock, AR/AP and tax; lock/stock banners use API details.
- Status colours consistent with the rest of the application.
- Keyboard operable, labelled, focus-visible, and not reliant on colour alone.
- Responsive: wide tables scroll with sticky headers instead of breaking the layout.
