---
description: Consuming the ERP API — the single API client, versioning, response envelope, error codes, query keys, pagination, filtering, sorting and mutations.
applyTo: "src/shared/api/**,src/modules/**/api.ts,src/modules/**/queries.ts,src/modules/**/mutations.ts,src/modules/**/schemas.ts,src/app/api/**"
---

# API Client and Data Fetching

The backend is the source of truth. The front-end's job is to call it correctly, cache it
predictably, and present what it returns without reinterpreting it.

## One client, one place

All HTTP goes through the client in `src/shared/api/client.ts`. Slices call it from their `api.ts`;
nothing else in the codebase calls `fetch` against the backend.

```text
Component → Query hook → slice api.ts → shared/api/client.ts → backend /api/v1
```

The client owns the base URL, auth, the `Accept-Language` and tenant headers, timeouts, envelope
unwrapping and error normalisation. Two thin variants sit on top of it — one for server components
and route handlers that reads the session from cookies, one for the browser that relies on the
cookie being sent automatically. Both share the same envelope and error handling.

```ts
// Bad — bypasses auth, envelope handling and error mapping
const res = await fetch("/api/v1/leads");
const leads = (await res.json()).data;

// Good
const leads = await leadsApi.list(filters);
```

Never build a URL by string concatenation in a component, and never hardcode `/api/v1` outside the
client — the version prefix is configured once.

## Versioning

The client applies the version prefix from configuration:

```ts
// src/shared/api/client.ts
const API_BASE = `${env.API_URL}/api/v1`;
```

Slice `api.ts` files use resource-relative paths only:

```ts
// src/modules/crm/leads/api.ts
export const leadsApi = {
  list: (filters: LeadFilters) => apiClient.get("/leads", { params: filters }),
  byId: (id: string) => apiClient.get(`/leads/${id}`),
  create: (data: LeadCreateInput) => apiClient.post("/leads", data),
};
```

When the backend introduces `/api/v2` for a resource, override the version for that call rather
than changing the global prefix, and migrate slice by slice.

## Response envelope

Every backend response uses the same shape:

```json
{
  "success": true,
  "data": {},
  "message": "Customer created successfully",
  "meta": {}
}
```

List responses carry pagination in `meta`:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "page_size": 25, "total": 250, "total_pages": 10 }
}
```

The envelope is unwrapped once, inside the client. Components and hooks receive `data` and
`meta` — never the envelope itself. Do not write `response.data.data` anywhere.

## Response validation

Parse every response through the slice's Zod schema. The network is not a type system, and a
backend field that silently changes shape should fail loudly at the boundary rather than render
`undefined` three components deep.

```ts
// src/modules/crm/leads/api.ts
export const leadsApi = {
  byId: async (id: string) => LeadSchema.parse(await apiClient.get(`/leads/${id}`)),
};
```

Infer types from schemas instead of maintaining a parallel set of interfaces:

```ts
export type Lead = z.infer<typeof LeadSchema>;
```

Backend fields are `snake_case`. Keep them as they come or convert consistently in the client —
pick one and never mix both conventions for the same field.

## Error handling

Errors arrive in the same envelope with a stable application code:

```json
{
  "success": false,
  "error": {
    "code": "INVENTORY_INSUFFICIENT_STOCK",
    "message": "Insufficient stock available",
    "details": {}
  }
}
```

The client turns a failed response into a typed `ApiError` carrying `code`, `message`, `details`
and `status`. Branch on `code`, never on message text:

```ts
// Bad
if (error.message.includes("stock")) {
  /* ... */
}

// Good
if (error.code === "INVENTORY_INSUFFICIENT_STOCK") {
  /* ... */
}
```

Map codes to user-facing copy in one place, `src/shared/api/errors.ts`, with a safe generic
fallback for unknown codes:

```text
AUTH_INVALID_CREDENTIALS   PERMISSION_DENIED     INSUFFICIENT_STOCK
AUTH_TOKEN_EXPIRED         RESOURCE_NOT_FOUND    INVALID_STATUS_TRANSITION
TENANT_ACCESS_DENIED       VALIDATION_ERROR      FINANCIAL_TRANSACTION_LOCKED
DUPLICATE_RESOURCE         INTEGRATION_ERROR
```

Never render a raw exception, stack trace, status code or backend internal message to the user.
`VALIDATION_ERROR` details are attached to the corresponding form fields rather than shown as one
opaque banner.

Handle the three failure classes distinctly: `401` triggers a refresh attempt and then a redirect
to login, `403` renders a "no access" state instead of an empty table, and a network or `5xx`
failure offers a retry.

## Query keys

Query keys are arrays, built by a factory per slice so invalidation cannot drift out of sync with
the keys it targets.

```ts
// src/modules/crm/leads/queries.ts
export const leadKeys = {
  all: ["leads"] as const,
  list: (filters: LeadFilters) => [...leadKeys.all, "list", filters] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};
```

Every parameter that changes the response belongs in the key — filters, pagination, sort and the
tenant. Never hand-write a key string at a call site, and never reuse one key for two shapes of
data.

The tenant is part of the cache identity. Clear the query cache on tenant switch and on logout so
one tenant's data can never be shown under another.

## Read hooks

Reads live in `queries.ts` and are the only way a component gets server data.

```ts
export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}
```

Defaults are configured once in `src/shared/api/query-client.ts` — `staleTime`, retry policy and
refetch behaviour. Do not retry on `4xx`; a permission error or validation failure will not
succeed on a second attempt. Use `keepPreviousData` for paginated tables so the grid does not
collapse between pages.

Every consuming component handles all four states: loading, empty, error and loaded. An empty
table with no explanation is a defect.

## Mutations

Writes live in `mutations.ts` together with the cache updates they imply.

```ts
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}
```

Invalidate every query the write affects, including other slices — creating a sales order changes
stock, so invalidate the stock keys too. Prefer invalidation over manually patching the cache.

Use optimistic updates only for cheap, reversible interactions such as toggling a flag or
reordering a list, and always implement the rollback. Never apply an optimistic update to money,
stock, posting or approval — the user must see the server's answer.

Guard against duplicate submits: disable the submit control while the mutation is in flight, and
never let a double click create two documents.

## Pagination

Every list view paginates. There are no unbounded list requests.

```text
GET /api/v1/customers?page=1&page_size=25
```

```ts
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
```

Page and page size live in the URL, and the control reads `total` and `total_pages` from `meta`
rather than counting rows. Do not request a large page size to avoid building pagination, and do
not fetch every page to compute a total the backend already returns.

## Filtering and sorting

Filters and sort belong in the URL search params, parsed and validated by the slice's
`FiltersSchema`, so a view can be shared, bookmarked and restored.

```text
/customers?search=john&status=active&country=UAE&created_from=2026-01-01
          &sort_by=created_at&sort_order=desc&page=1&page_size=25
```

Pass filters through as request params. Never filter, sort or paginate a partial dataset in the
browser and present it as the whole result — the answer would be wrong the moment there is a
second page. Client-side sorting is acceptable only for a fully loaded, bounded list.

Debounce search input before it becomes a request, and keep the sort field within the set the
backend allows.

## Authenticated requests

The access token lives in an httpOnly cookie set by the BFF route handlers under
`src/app/api/auth/`. It is never read by client JavaScript, never placed in `localStorage` or
`sessionStorage`, and never stored in a Zustand store.

```text
Login form → route handler → backend /api/v1/auth/login → httpOnly cookie → session
Request → cookie sent automatically → backend validates
401 → single refresh attempt → retry once → otherwise redirect to login
```

Refresh is deduplicated: concurrent `401`s wait on one in-flight refresh instead of firing several
and racing the token rotation.

Never send `tenant_id` from the client as a way of choosing a tenant. Tenant switching goes through
the backend, which reissues the session; the front-end only reflects the tenant it was given.

## Server-side fetching and prefetching

Route segments may prefetch through the slice's `api.ts` and hand the result to the client via a
`HydrationBoundary`, so the first paint has data and the client cache stays authoritative
afterwards.

```tsx
const queryClient = getQueryClient();
await queryClient.prefetchQuery({
  queryKey: leadKeys.list(filters),
  queryFn: () => leadsApi.list(filters),
});
```

Create a fresh query client per server request — never share one across requests, or one user's
data will leak into another's response. When a screen is read-only and non-personalised, fetching
directly in the server component and skipping the client cache is simpler and preferred.

## Route handlers

Route handlers under `src/app/api/` exist for what the browser must not do itself: exchanging
credentials for cookies, refreshing and clearing the session, proxying an upload, and any call
that needs a server-only secret. They are not a general proxy — do not mirror every backend
endpoint behind one.

A route handler validates its input, forwards to the backend, and returns the backend's error code
unchanged. It never contains business rules and never logs credentials or tokens.

## Request checklist

Before a slice's data layer is considered complete, verify all of:

```text
Single client         Zod validation      Error-code mapping
Typed api.ts          Query key factory   Loading / empty / error states
Version from config   Invalidation        Pagination, filters and sort in the URL
```
