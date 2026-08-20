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

export function getErrorMessage(codeOrError: unknown): string {
  const code = codeFrom(codeOrError);
  if (!code) {
    return FALLBACK_ERROR_MESSAGE;
  }
  return ERROR_MESSAGES[code] ?? FALLBACK_ERROR_MESSAGE;
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
      const record = item as { loc?: unknown; msg?: unknown; message?: unknown };
      const name = fieldNameFromLoc(record.loc);
      const message =
        typeof record.msg === "string"
          ? record.msg
          : typeof record.message === "string"
            ? record.message
            : null;
      if (name && message) {
        fields[name] = message;
      }
    }
    return fields;
  }

  if (typeof details === "object") {
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === "string") {
        fields[key] = value;
      }
    }
  }

  return fields;
}
