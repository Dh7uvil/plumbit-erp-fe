import { API_VERSION_PREFIX, BFF_AUTH_PREFIX } from "@/config/constants";
import { reportError } from "@/integrations/error-reporting/report";
import { parseEnvelope, parseListMeta, type ListResponse } from "@/shared/api/envelope";
import { ApiError, getErrorMessage, isApiError } from "@/shared/api/errors";

const DEFAULT_TIMEOUT_MS = 30_000;

export type RequestParamValue = string | number | boolean | null | undefined | readonly string[];
export type RequestParams = Record<string, RequestParamValue>;

export type RequestConfig = {
  params?: RequestParams;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type InternalConfig = RequestConfig & {
  method: string;
  body?: unknown;
  basePrefix: string;
  skipRefresh?: boolean;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function resolveBase(prefix: string): string {
  if (isBrowser()) {
    return prefix;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return `${appUrl ?? "http://127.0.0.1:3000"}${prefix}`;
}

function buildUrl(path: string, basePrefix: string, params?: RequestParams): string {
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveBase(basePrefix);
  const url = base.startsWith("http")
    ? new URL(`${base}${normalisedPath}`)
    : new URL(`${base}${normalisedPath}`, "http://local.invalid");

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null || item === "") {
            continue;
          }
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  if (base.startsWith("http")) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

function mergeSignals(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) {
    return timeout;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([timeout, signal]);
  }
  return timeout;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!isBrowser()) {
    return false;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = fetch(`${BFF_AUTH_PREFIX}/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function shouldReport(error: ApiError): boolean {
  if (error.status === 401 || error.status === 403) {
    return false;
  }
  if (error.code === "VALIDATION_ERROR") {
    return false;
  }
  return error.status >= 500 || error.code === "NETWORK_ERROR";
}

async function request<T>(path: string, config: InternalConfig, hasRetried = false): Promise<T> {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(path, config.basePrefix, config.params);
  const headers = new Headers(config.headers);

  headers.set("Accept", "application/json");
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }
  if (config.body !== undefined && !(config.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: config.method,
      headers,
      body:
        config.body === undefined
          ? undefined
          : config.body instanceof FormData
            ? config.body
            : JSON.stringify(config.body),
      credentials: "include",
      signal: mergeSignals(timeoutMs, config.signal),
    });
  } catch (error) {
    const apiError = new ApiError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"), 0, error);
    reportError(apiError, { path, method: config.method });
    throw apiError;
  }

  if (response.status === 401 && isBrowser() && !hasRetried && !config.skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, config, true);
    }
    if (
      config.basePrefix === API_VERSION_PREFIX &&
      !window.location.pathname.startsWith("/login")
    ) {
      // The shared client is not a React component, so router navigation is unavailable.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard fallback after failed refresh
      window.location.assign("/login");
    }
  }

  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch (error) {
      const apiError = new ApiError("UNKNOWN", getErrorMessage("UNKNOWN"), response.status);
      reportError(error, { path, method: config.method, http_status: response.status });
      throw apiError;
    }
  }

  if (payload === null) {
    if (!response.ok) {
      throw new ApiError("UNKNOWN", getErrorMessage("UNKNOWN"), response.status);
    }
    return null as T;
  }

  const envelope = parseEnvelope(payload);
  if (!response.ok || !envelope.success || envelope.error) {
    const code = envelope.error?.code ?? "UNKNOWN";
    const apiError = new ApiError(
      code,
      getErrorMessage(code),
      response.status,
      envelope.error?.details,
    );
    if (shouldReport(apiError)) {
      reportError(apiError, {
        path,
        method: config.method,
        http_status: response.status,
        error_code: code,
      });
    }
    throw apiError;
  }

  return (envelope.data ?? null) as T;
}

async function requestList<T>(
  path: string,
  config: InternalConfig,
  hasRetried = false,
): Promise<ListResponse<T>> {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(path, config.basePrefix, config.params);
  const headers = new Headers(config.headers);

  headers.set("Accept", "application/json");
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: config.method,
      headers,
      credentials: "include",
      signal: mergeSignals(timeoutMs, config.signal),
    });
  } catch (error) {
    const apiError = new ApiError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"), 0, error);
    reportError(apiError, { path, method: config.method });
    throw apiError;
  }

  if (response.status === 401 && isBrowser() && !hasRetried && !config.skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return requestList<T>(path, config, true);
    }
    if (
      config.basePrefix === API_VERSION_PREFIX &&
      !window.location.pathname.startsWith("/login")
    ) {
      // The shared client is not a React component, so router navigation is unavailable.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard fallback after failed refresh
      window.location.assign("/login");
    }
  }

  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch (error) {
      const apiError = new ApiError("UNKNOWN", getErrorMessage("UNKNOWN"), response.status);
      reportError(error, { path, method: config.method, http_status: response.status });
      throw apiError;
    }
  }

  if (payload === null) {
    if (!response.ok) {
      throw new ApiError("UNKNOWN", getErrorMessage("UNKNOWN"), response.status);
    }
    return { data: [] as T, meta: parseListMeta(undefined, 0) };
  }

  const envelope = parseEnvelope(payload);
  if (!response.ok || !envelope.success || envelope.error) {
    const code = envelope.error?.code ?? "UNKNOWN";
    const apiError = new ApiError(
      code,
      getErrorMessage(code),
      response.status,
      envelope.error?.details,
    );
    if (shouldReport(apiError)) {
      reportError(apiError, {
        path,
        method: config.method,
        http_status: response.status,
        error_code: code,
      });
    }
    throw apiError;
  }

  const data = (envelope.data ?? []) as T;
  const itemCount = Array.isArray(data) ? data.length : 0;
  return { data, meta: parseListMeta(envelope.meta, itemCount) };
}

function createClient(basePrefix: string, skipRefresh = false) {
  return {
    get<T>(path: string, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "GET", basePrefix, skipRefresh });
    },
    getList<T>(path: string, config: RequestConfig = {}): Promise<ListResponse<T>> {
      return requestList<T>(path, { ...config, method: "GET", basePrefix, skipRefresh });
    },
    post<T>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "POST", body, basePrefix, skipRefresh });
    },
    postForm<T>(path: string, body: FormData, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "POST", body, basePrefix, skipRefresh });
    },
    put<T>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "PUT", body, basePrefix, skipRefresh });
    },
    patch<T>(path: string, body?: unknown, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "PATCH", body, basePrefix, skipRefresh });
    },
    delete<T>(path: string, config: RequestConfig = {}): Promise<T> {
      return request<T>(path, { ...config, method: "DELETE", basePrefix, skipRefresh });
    },
  };
}

export const apiClient = createClient(API_VERSION_PREFIX);
export const bffClient = createClient(BFF_AUTH_PREFIX, true);

export { type ListResponse } from "@/shared/api/envelope";

export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}
