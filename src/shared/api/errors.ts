export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  AUTH_TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_RESET_TOKEN_INVALID: "This reset link is invalid. Request a new one.",
  AUTH_RESET_TOKEN_EXPIRED: "This reset link has expired. Request a new one.",
  TENANT_ACCESS_DENIED: "You do not have access to this organisation.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  RESOURCE_NOT_FOUND: "The requested record could not be found.",
  DUPLICATE_RESOURCE: "A record with these details already exists.",
  INVALID_STATUS_TRANSITION: "This action is not available for the current status.",
  FINANCIAL_TRANSACTION_LOCKED: "This record is posted and can no longer be changed.",
  INVENTORY_INSUFFICIENT_STOCK: "There is not enough stock to complete this action.",
  INSUFFICIENT_STOCK: "There is not enough stock to complete this action.",
  PERIOD_LOCKED: "This date falls in a locked period and cannot be changed.",
  PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK: "The period cannot be locked while stock is negative.",
  DRAFT_DOCUMENT_NOT_POSTED: "This document is still a draft and has not been posted.",
  DOCUMENT_STALE: "This document changed since you opened it. Reload and try again.",
  IDEMPOTENCY_CONFLICT: "This request was already processed. Refresh to see the latest result.",
  EXCHANGE_RATE_MISSING: "No exchange rate is recorded for this currency and date.",
  EINVOICE_NOT_READY: "This document is not ready to submit for e-invoicing.",
  EINVOICE_REJECTED: "The e-invoice was rejected. Review the message and issue a credit note.",
  EINVOICE_ASP_UNAVAILABLE: "The e-invoicing service is unavailable. Please try again later.",
  EINVOICE_ALREADY_EXCHANGED: "This e-invoice has already been exchanged and cannot be changed.",
  INTEGRATION_ERROR: "An external service is unavailable. Please try again later.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function codeFrom(codeOrError: unknown): string | undefined {
  if (typeof codeOrError === "string") {
    return codeOrError;
  }
  if (isApiError(codeOrError)) {
    return codeOrError.code;
  }
  return undefined;
}

function detailsRecord(details: unknown): Record<string, unknown> | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }
  return details as Record<string, unknown>;
}

function stringDetail(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function appendDetailSentence(base: string, fragments: Array<string | null>): string {
  const parts = fragments.filter((part): part is string => Boolean(part));
  if (parts.length === 0) {
    return base;
  }
  return `${base.replace(/\.$/, "")}. ${parts.join(" ")}`;
}

export function getErrorMessage(codeOrError: unknown): string {
  const code = codeFrom(codeOrError);
  if (!code) {
    return FALLBACK_ERROR_MESSAGE;
  }
  const base = ERROR_MESSAGES[code] ?? FALLBACK_ERROR_MESSAGE;
  const details = isApiError(codeOrError) ? detailsRecord(codeOrError.details) : null;
  if (!details) {
    return base;
  }
  if (code === "INVENTORY_INSUFFICIENT_STOCK" || code === "INSUFFICIENT_STOCK") {
    const warehouse =
      stringDetail(details, "warehouse_code") ?? stringDetail(details, "warehouse_name");
    const available = stringDetail(details, "available_qty");
    const requested = stringDetail(details, "requested_qty");
    return appendDetailSentence(base, [
      warehouse ? `Warehouse ${warehouse}.` : null,
      available ? `Available ${available}.` : null,
      requested ? `Requested ${requested}.` : null,
    ]);
  }
  if (code === "PERIOD_LOCKED") {
    const lockDate = stringDetail(details, "lock_date");
    const hardLock = stringDetail(details, "hard_lock_date");
    const documentDate = stringDetail(details, "document_date");
    return appendDetailSentence(base, [
      lockDate ? `Lock date ${lockDate}.` : null,
      hardLock ? `Hard lock ${hardLock}.` : null,
      documentDate ? `Document date ${documentDate}.` : null,
    ]);
  }
  return base;
}

export function isClientError(error: unknown): boolean {
  return isApiError(error) && error.status >= 400 && error.status < 500;
}

function fieldNameFromLoc(loc: unknown): string | null {
  if (!Array.isArray(loc)) {
    return null;
  }
  const parts = loc.filter(
    (part): part is string => typeof part === "string" && part !== "body" && part !== "query",
  );
  return parts.join(".") || null;
}

function sanitizeValidationMessage(message: string): string {
  return message.replace(/^Value error,\s*/i, "").trim();
}

export function getValidationFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || error.code !== "VALIDATION_ERROR" || error.details == null) {
    return {};
  }

  const fields: Record<string, string> = {};
  const details = error.details;

  if (Array.isArray(details)) {
    for (const item of details) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as { loc?: unknown; path?: unknown; msg?: unknown; message?: unknown };
      const name = fieldNameFromLoc(record.loc) ?? fieldNameFromLoc(record.path);
      const message =
        typeof record.msg === "string"
          ? record.msg
          : typeof record.message === "string"
            ? record.message
            : null;
      if (name && message) {
        fields[name] = sanitizeValidationMessage(message);
      }
    }
    return fields;
  }

  if (typeof details === "object") {
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === "string") {
        fields[key] = sanitizeValidationMessage(value);
      }
    }
  }

  return fields;
}
