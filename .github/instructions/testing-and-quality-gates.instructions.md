---
description: Lightweight testing strategy — types and lint as the primary gate, Playwright for critical flows, targeted unit tests, and the CI pipeline.
applyTo: "e2e/**,src/**/*.test.ts,src/**/*.test.tsx,eslint.config.mjs,playwright.config.ts,package.json"
---

# Testing and Quality Gates

This project deliberately keeps automated testing light. The primary gates are the type system and
the linter, backed by end-to-end coverage of the flows that would hurt most if they broke. We do not
chase a coverage number, and we do not write a test that only restates what TypeScript already
guarantees.

The trade-off is explicit: fewer tests means the gates that remain must actually run and must stay
green.

## The gates, in order of value

```text
1. TypeScript strict          catches most front-end defects before anything runs
2. ESLint                     catches hook misuse, unsafe patterns, accidental client/server mixing
3. Zod at the boundary        catches a backend response that no longer matches expectations
4. Production build           catches server/client boundary errors that dev mode tolerates
5. Playwright critical flows  catches a broken login, list, form or approval
6. Targeted unit tests        only for logic with real branching
```

Strict mode is not negotiable, and neither is the absence of escape hatches. An `any`, a non-null
assertion covering a real possibility, or a `@ts-ignore` without justification removes the gate we
rely on most.

## Critical end-to-end flows

Playwright covers the flows whose failure would stop the business, and little else. Specs live in
`e2e/`, named for the flow rather than the file under test.

```text
e2e/
├── auth.spec.ts               login, logout, session expiry redirect
├── tenant-switch.spec.ts      switching tenant swaps the data and clears the previous tenant's
├── permissions.spec.ts        a gated route and a gated action are unavailable to a limited user.
                               Sidebar omits modules without `*.read` and drops empty groups.
                               Cover a missing create/update/delete affordance when a limited test
                               user exists; do not invent that user to land a helper change.
├── quotation-approval.spec.ts create → submit → approve, with the state reflected
├── invoice-posting.spec.ts    post an invoice, then confirm it is no longer editable
├── period-lock.spec.ts        PERIOD_LOCKED rejects a dated write; UI shows the lock date
├── insufficient-stock.spec.ts INVENTORY_INSUFFICIENT_STOCK surfaces warehouse and qty
├── credit-note.spec.ts        posted invoice offers credit note; original row stays unchanged
└── einvoice.spec.ts           when the API exists: post → pending → exchanged;
                               rejected → credit note offered; draft never submitted
```

Do not add `leads.spec.ts` until the leads API exists. Add a spec when a flow becomes
business-critical, not for every new screen.

Add a spec when a flow becomes business-critical, not for every new screen. If a flow is not worth an
end-to-end test, it is also not worth a mountain of unit tests — rely on the types and review it well.

Each spec asserts what the user sees, uses roles and labels rather than CSS selectors, and cleans up
the data it creates. Tests run against a dedicated test environment and never against production.

```ts
await page.getByRole("button", { name: "Approve" }).click();
await expect(page.getByText("Approved")).toBeVisible();
```

Selecting by role and accessible name has a useful side effect: a component that is hard to target is
usually a component that a screen reader cannot use either.

## What is worth a unit test

Write a unit test when logic has branches that types cannot check and a bug would be silent:

```text
Money and quantity formatting, including zero, negative and multi-currency
Search-param parsing and serialisation, including malformed input
Permission helpers, including inherited, missing, and optional CRUD keys (create/update/delete)
Error-code to message mapping, including the unknown-code fallback
Date and timezone conversion at boundaries
Zod schemas for a payload shape that has surprised us before
```

Do not unit test that a component renders its props, that a query hook calls its API function, or that
a library works. Those tests cost more to maintain than the defects they catch.

Use Vitest for these, keep them beside the code as `*.test.ts`, and keep them fast and independent.

## Manual verification before review

Front-end defects concentrate in states that are easy to skip while building. Check each one on any
screen you touch:

```text
Loading      skeleton appears and matches the final layout
Empty        explains itself and offers the next action
Error        a mapped message with a retry, never a stack trace
No access    a clear message rather than an empty table
Slow network throttled: nothing flashes, jumps or double-submits
Keyboard     the whole flow completes without a mouse
Narrow       the layout holds; wide tables scroll rather than break
```

For anything touching money, workflow status, posting, lock, stock, VAT or tenancy, also confirm
the figures match the backend, the buttons match `available_actions` (not a local table), posted
records are not editable, and switching tenant leaves nothing behind.

## Tooling

```text
TypeScript  ESLint  Prettier  Playwright  Vitest  Husky + lint-staged
```

Pre-commit hooks run type checking, lint and formatting on staged files so CI is not the first place a
failure is discovered. `next lint` no longer exists — ESLint runs directly, and `next build` does not
lint on its own.

## CI pipeline

```text
Push → Install → Type Check → Lint → Format Check → Build → E2E (critical flows) → Dependency Audit
```

A red pipeline blocks merge. Do not skip a test, mark it `.skip`, delete it or loosen an assertion to
get a green build — with this few tests, each one is load-bearing. A flaky spec is fixed or replaced,
never silenced.

If a specific test is genuinely obsolete because the behaviour intentionally changed, remove it in the
same pull request that changes the behaviour and say so in the description.
