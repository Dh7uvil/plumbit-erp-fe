import "server-only";

import { cookies, headers } from "next/headers";

import { env } from "@/config/env";
import { API_VERSION_PREFIX } from "@/config/constants";
import {
  ErrorEnvelopeSchema,
  FastApiValidationSchema,
  SuccessEnvelopeSchema,
  parseListMeta,
  type ListResponse,
} from "@/shared/api/envelope";
import { ApiError } from "@/shared/api/errors";
import { reportError } from "@/integrations/error-reporting/report";

type ServerRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  accessToken?: string | null;
};

function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.API_URL.replace(/\/$/, "")}${API_VERSION_PREFIX}${normalized}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "INTERNAL_ERROR",
      "The server returned an unexpected response",
      response.status,
    );
  }
}

function toApiError(response: Response, payload: unknown): ApiError {
  const errorEnvelope = ErrorEnvelopeSchema.safeParse(payload);
  if (errorEnvelope.success) {
    return new ApiError(
      errorEnvelope.data.error.code,
      errorEnvelope.data.error.message ?? "Request failed",
      response.status,
      errorEnvelope.data.error.details,
    );
  }

  const fastApi = FastApiValidationSchema.safeParse(payload);
  if (fastApi.success) {
    return new ApiError(
      "VALIDATION_ERROR",
      "Validation failed",
      response.status,
      fastApi.data.detail,
    );
  }

  if (response.status === 401) {
    return new ApiError("AUTH_TOKEN_EXPIRED", "Session expired", 401);
  }

  return new ApiError("INTERNAL_ERROR", "Request failed", response.status);
}

export async function serverRequest<T>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const accessToken =
    options.accessToken === undefined
      ? cookieStore.get(env.AUTH_ACCESS_COOKIE)?.value
      : (options.accessToken ?? undefined);

  const requestHeaders = new Headers({
    Accept: "application/json",
    "x-request-id": headerStore.get("x-request-id") ?? crypto.randomUUID(),
  });
  const language = headerStore.get("accept-language");
  if (language) {
    requestHeaders.set("Accept-Language", language);
  }
  if (options.body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(backendUrl(path), {
      method: options.method ?? "GET",
      headers: requestHeaders,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("NETWORK_ERROR", "Network request failed", 0);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    const apiError = toApiError(response, payload);
    if (apiError.status >= 500) {
      reportError(apiError, { endpoint: path, status: apiError.status, code: apiError.code });
    }
    throw apiError;
  }

  if (payload === null) {
    return null as T;
  }

  const envelope = SuccessEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    reportError(envelope.error, { endpoint: path, status: response.status });
    throw new ApiError(
      "INTERNAL_ERROR",
      "The server returned an unexpected response",
      response.status,
    );
  }

  return envelope.data.data as T;
}

export async function serverRequestList<T>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<ListResponse<T>> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const accessToken =
    options.accessToken === undefined
      ? cookieStore.get(env.AUTH_ACCESS_COOKIE)?.value
      : (options.accessToken ?? undefined);

  const requestHeaders = new Headers({
    Accept: "application/json",
    "x-request-id": headerStore.get("x-request-id") ?? crypto.randomUUID(),
  });
  const language = headerStore.get("accept-language");
  if (language) {
    requestHeaders.set("Accept-Language", language);
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(backendUrl(path), {
      method: options.method ?? "GET",
      headers: requestHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("NETWORK_ERROR", "Network request failed", 0);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    const apiError = toApiError(response, payload);
    if (apiError.status >= 500) {
      reportError(apiError, { endpoint: path, status: apiError.status, code: apiError.code });
    }
    throw apiError;
  }

  if (payload === null) {
    return { data: [] as T, meta: parseListMeta(undefined, 0) };
  }

  const envelope = SuccessEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    reportError(envelope.error, { endpoint: path, status: response.status });
    throw new ApiError(
      "INTERNAL_ERROR",
      "The server returned an unexpected response",
      response.status,
    );
  }

  const data = (envelope.data.data ?? []) as T;
  const itemCount = Array.isArray(data) ? data.length : 0;
  return { data, meta: parseListMeta(envelope.data.meta, itemCount) };
}
