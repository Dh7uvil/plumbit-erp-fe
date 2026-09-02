---
description: Validated environment configuration, public vs server-only variables, security headers, uploads, timezone handling, the technology stack and deployment topology.
applyTo: "src/config/**,next.config.ts,.env.example,Dockerfile,tsconfig.json,package.json,eslint.config.mjs"
---

# Configuration and Environment

## Centralized, validated configuration

All configuration is declared and validated once in `src/config/env.ts` using a Zod schema, and the
rest of the application imports that object. Do not scatter `process.env` reads through components,
hooks or API files.

```ts
// src/config/env.ts
const serverSchema = z.object({
  API_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["development", "testing", "staging", "production"]),
});
```

Validation runs at startup so a missing or malformed variable fails the boot with a clear message
rather than surfacing as a runtime error on a user's screen.

Configuration covers:

```text
Backend API base URL and version   Session and cookie settings   Feature flags
App URL and environment name       Upload limits and allowed types
Analytics and error reporting keys Locale, currency and timezone defaults
```

## Public versus server-only variables

`NEXT_PUBLIC_` is not a naming convention — it is a publishing decision. Any variable with that
prefix is inlined into the JavaScript bundle and visible to anyone who opens the page.

```text
NEXT_PUBLIC_*     the public app URL, environment name, a public analytics key, feature flags
Server-only       backend URL used server-side, session secret, any API key or token
```

Never add `NEXT_PUBLIC_` to a secret to make it reachable from a client component. If a client
component needs the result of a privileged call, route it through a route handler or server action
instead.

Server-only variables are read only in server components, route handlers, server actions and
`proxy.ts`. Importing a server-only config module into a client component must fail loudly.

## Secrets

Never commit `.env`, `.env.local`, API keys, session secrets or tokens. Use environment variables in
CI/CD and a secrets manager in deployed environments.

`.env.example` contains placeholders only, never real values, and every new variable is added there
in the same commit that introduces it:

```env
API_URL=
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ENVIRONMENT=
```

If a secret is committed, rotate it — removing the file from the working tree is not sufficient.
A key that reached a client bundle is public the moment it deployed, regardless of prefix.

## Environment separation

Maintain four environments: Development, Testing, Staging and Production. Never point a local build
or an automated test run at the production API, and never use production credentials locally.

The environment name is configuration, not a code branch. Where behaviour genuinely differs — a
debug panel, verbose logging, a mock — gate it on configuration in one place rather than sprinkling
`if (isProduction)` through features.

## Security defaults

These are mandatory, not optional hardening:

```text
HTTPS in production              Session in httpOnly Secure SameSite cookie
Content Security Policy          No token in localStorage or sessionStorage
Strict security headers          No secret in the client bundle
Input validation on params       No dangerouslySetInnerHTML without sanitisation
Validated redirect targets       Upload size and type validation
Server-side permission gating    Dependency audit in CI
```

Security headers are configured centrally in `next.config.ts`:

```text
Content-Security-Policy   Strict-Transport-Security   X-Content-Type-Options
Referrer-Policy           X-Frame-Options / frame-ancestors   Permissions-Policy
```

Avoid `dangerouslySetInnerHTML`. When rich text from the backend must be rendered, sanitise it first
and keep that in one shared component so the policy is applied consistently.

Never redirect to a URL taken from a query parameter without checking it against an allowlist of
internal paths — an open redirect is a phishing vector on a login screen.

Cookie flags, CSP directives, upload limits and allowed origins are configuration values, not
constants scattered across route handlers.

## File uploads

Validate size and type in the browser for fast feedback, and treat the backend's validation as the
real gate. Never trust a filename or a reported MIME type, and never render an uploaded filename as
HTML.

Uploads go through a route handler or a backend-issued signed URL. The front-end never holds an
object-storage credential, and private documents are fetched through short-lived signed URLs rather
than a public bucket path.

Show progress, allow cancellation, and enforce the configured maximum size before starting the
request rather than after a long upload fails.

## Locale, currency and time

Timestamps arrive from the backend in UTC and are converted to the user's timezone at render time
only. Never construct a date from a local-time string and send it as if it were UTC, and never rely
on the server's local timezone during rendering.

Dates, numbers and currency are formatted through the shared formatters built on `Intl`, seeded with
the user's locale and the tenant's default currency from configuration. Do not add a date library to
do what `Intl` and the platform already do.

Keep interface copy in components. Do not retrofit an i18n library in this pass. Do not concatenate
sentences from fragments. Do not add Arabic/RTL until a product decision exists.

## Technology stack

```text
Framework:        Next.js 16.x (App Router), React 19.x, Node.js 20.9+
Language:         TypeScript 5.9+/7.x, strict mode, no implicit any
Styling:          Tailwind CSS 4.x, shadcn/ui (Radix primitives), lucide-react icons
Server data:      TanStack Query v5
Tables:           TanStack Table
Client state:     Zustand, only where the URL and component state do not fit
Forms:            react-hook-form with Zod resolvers
Validation:       Zod (forms, API responses, env, search params)
Bundler:          Turbopack (the Next.js 16 default)
Code quality:     ESLint, Prettier, TypeScript, Husky + lint-staged
Testing:          Playwright for critical end-to-end flows, Vitest where pure logic warrants it
Infrastructure:   Docker, AWS
Observability:    Structured client error reporting, Web Vitals
```

`next lint` was removed in Next.js 16 — run ESLint directly, and note that `next build` no longer
lints. TypeScript strict mode is not negotiable: no `any`, no non-null assertion to silence a real
possibility, and no `@ts-ignore` without a comment explaining what makes it safe.

Do not introduce a new dependency unless the existing ones genuinely cannot solve the problem. A
component we can write in fifty lines is cheaper than a library we must keep updated, and every
client-side dependency is paid for by every user on every page load.

## Deployment topology

```text
Internet → AWS Amplify (Next.js)
              → API Gateway → Lambda (FastAPI)
                    ├── Amazon RDS PostgreSQL
                    └── Amazon S3 (MinIO locally)
```

Redis is not part of this topology and is not required. ASP credentials, JWT secrets and object-
storage keys are server-only on the backend — never `NEXT_PUBLIC_`. The front-end holds no
database connection, no queue and no e-invoicing provider key. Everything it needs comes from the
backend API. Build once and configure per environment — a production image must not be rebuilt to change an
API URL, so keep runtime-varying values out of the build where possible and document those that must
be baked in.

The container runs as a non-root user, exposes a health route for the load balancer, and its build
does not embed a `.env` file.
