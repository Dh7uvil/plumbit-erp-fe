---
description: Client and server-side error reporting, what must never be logged, request correlation, Web Vitals and performance budgets.
applyTo: "src/**,next.config.ts"
---

# Logging and Observability

The front-end cannot see what went wrong on a user's machine unless it reports it. It also sits in
front of tenant and financial data, so what it reports must be chosen carefully.

## Error reporting

Errors are reported through the wrapper in `src/integrations/error-reporting/`, never by importing a
vendor SDK into a feature. One entry point means one place to configure sampling, one place to strip
sensitive fields, and one place to swap providers.

Report from the boundaries rather than from every call site:

```text
error.tsx / global-error.tsx     rendering and data failures per route
shared/api/client.ts             unexpected API failures (5xx, network, parse errors)
mutation onError                 failed writes, with the action that failed
window error / unhandledrejection  anything that escaped a boundary
```

Do not report expected outcomes. A `401` on an expired session, a `403` on a gated action or a
`VALIDATION_ERROR` on a form is normal behaviour — reporting them buries the real defects in noise. A
`5xx`, a schema-parse failure or a render crash is worth reporting.

Every report carries enough context to act on:

```text
request_id  route  tenant_id  user_id  error_code  http_status  app_version  environment
```

`request_id` comes from the header set in `proxy.ts` and is echoed on API requests, so a client
report can be joined to the backend log for the same request.

## Never log or report

```text
passwords                access tokens         refresh tokens
session cookies          API keys              full request or response bodies
financial figures        customer PII          another tenant's data
```

Redact at the reporting layer rather than trusting call sites, and scrub URLs and breadcrumbs too — a
token in a query string is still a leaked token. Never attach a full API response to an error report;
attach the error code, the status and the endpoint.

Breadcrumbs record what the user did — navigated, opened a dialog, submitted a form — not what they
typed. Never record keystrokes, form values or clipboard contents, and mask inputs in any session
replay tooling.

## Console discipline

`console.log` is for local debugging and does not survive review. Where a diagnostic genuinely
belongs in the shipped app, route it through the reporting wrapper at the appropriate level so it can
be sampled and redacted. Server-side logs from route handlers are structured objects, not
interpolated strings, and follow the same redaction rules.

## Audit trails

Audit logging is the backend's responsibility — it happens where the business meaning and the
authoritative before-and-after values are known. The front-end never writes an audit record and never
treats a client-side log as an audit trail.

The front-end's job is to make the trail visible and legible where users need it:

```text
who  when (with timezone)  what changed  old value → new value
```

```text
User: Dhruvil     Action: UPDATE     Entity: Sales Order SO-2026-000042
Status: draft → approved     2026-08-19 14:31 GST
```

Audit views are read-only. Never present an edit or delete affordance on an audit entry, and page
them like any other list.

## Web Vitals and performance budgets

Report Web Vitals from the root layout through the same reporting wrapper, and treat regressions as
defects rather than trivia. The metrics that matter here are the ones users feel on data-heavy
screens:

```text
LCP  the list or detail content, not the shell
INP  interaction latency on tables, filters and forms
CLS  layout shift when data replaces a skeleton
TTFB server response for authenticated, dynamic pages
```

Budget the bundle as well as the runtime: track the size of the shared client bundle and the largest
route, and justify an increase in the pull request that causes it.

## Performance guardrails

Avoid:

```text
Request waterfalls        Rendering thousands of rows at once
Fetching in a loop        Re-fetching on every keystroke
Fetching in useEffect     Large synchronous work on the main thread
```

Use:

```text
parallel requests  server prefetch  pagination  virtualised long lists
debounced search   memoised expensive derivations  dynamic imports  job-based bulk work
```

A screen that issues one request per row is a defect, not a style preference — take the data from the
list response or ask the backend for a batched endpoint. Skeletons must match the final layout so
data landing does not shift the page.

## Health and diagnostics

The application exposes a health route for the load balancer that reports only whether the process is
serving. It must not expose the backend URL, environment variables, dependency versions, build
secrets or connection details.

Never build a debug page that dumps the session, tokens or raw API responses. If a diagnostic panel
is genuinely needed, gate it on configuration, keep it out of production, and redact the same fields
as the reporting layer.
