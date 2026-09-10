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
  SUPPLIER_SKU_NOT_MAPPED: "This supplier SKU is not mapped to a product.",
  GRN_OVER_RECEIPT: "Received quantity is above the allowed over-receipt tolerance.",
  GRN_CANNOT_CANCEL: "This goods receipt cannot be cancelled.",
  QUALITY_QTY_MISMATCH: "Inspection quantities do not add up.",
  COST_LAYER_IMBALANCE: "Stock cost layers are out of balance. Refresh and try again.",
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
  ACCOUNT_ROLE_UNMAPPED: "A required system account is not mapped. Map it before posting.",
  ACCOUNT_NOT_POSTABLE: "This account cannot be posted to. Choose a postable account.",
  JOURNAL_LINE_INVALID: "Each journal line must have either a debit or a credit, not both.",
  JOURNAL_UNBALANCED: "Journal debit and credit totals must match.",
  INVOICE_QTY_EXCEEDED: "Invoiced quantity is more than the remaining quantity on the source document.",
  EXPORT_EVIDENCE_MISSING: "Export evidence is missing. Posting is allowed, but BL or customs documents should be attached.",
  CREDIT_QTY_EXCEEDED: "Credited quantity is more than the remaining quantity on the invoice.",
  DEBIT_QTY_EXCEEDED: "Debited quantity is more than the remaining quantity on the bill.",
  PARTY_REQUIRED_FOR_CONTROL_ACCOUNT: "A party is required when posting to an AR or AP control account.",
  FISCAL_YEAR_LOCKED:
    "The fiscal year start cannot change after document numbers have been issued.",
  OPENING_STOCK_VALUE_MISMATCH:
    "Opening inventory must equal the sum of opening stock cost layers.",
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

function numberDetail(details: Record<string, unknown>, key: string): number | null {
  const value = details[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function negativeStockBalanceFragment(details: Record<string, unknown>): string | null {
  const balances = details.balances;
  if (!Array.isArray(balances) || balances.length === 0) {
    return null;
  }
  const parts: string[] = [];
  for (const row of balances.slice(0, 5)) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const record = row as Record<string, unknown>;
    const warehouse = stringDetail(record, "warehouse_code");
    const sku = stringDetail(record, "sku");
    const qty = stringDetail(record, "qty_on_hand");
    const label = [warehouse, sku, qty].filter(Boolean).join(" ");
    if (label) {
      parts.push(label);
    }
  }
  if (parts.length === 0) {
    return null;
  }
  const total = numberDetail(details, "total_count");
  const remaining = total != null ? Math.max(0, total - balances.length) : 0;
  const listed = `${parts.join("; ")}.`;
  return remaining > 0 ? `${listed} ${remaining} more.` : listed;
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
    const tier = stringDetail(details, "tier");
    const reason = stringDetail(details, "reason");
    const tierLabel =
      tier === "hard" ? "Books closed." : tier === "soft" ? "Transactions locked." : null;
    return appendDetailSentence(base, [
      lockDate ? `Lock date ${lockDate}.` : null,
      hardLock ? `Hard lock ${hardLock}.` : null,
      documentDate ? `Document date ${documentDate}.` : null,
      tierLabel,
      reason ? `${reason}.` : null,
    ]);
  }
  if (code === "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK") {
    const reason = stringDetail(details, "reason");
    const reasonText =
      reason === "acknowledgement_required"
        ? "Negative stock exists. Confirm to lock anyway."
        : reason === "negative_stock_disallowed"
          ? "Negative stock is not allowed."
          : null;
    return appendDetailSentence(base, [reasonText, negativeStockBalanceFragment(details)]);
  }
  if (code === "FISCAL_YEAR_LOCKED") {
    const requiresOverride = details.requires_override === true;
    const requiresAck = details.requires_acknowledgement === true;
    return appendDetailSentence(base, [
      requiresOverride ? "An override permission is required." : null,
      requiresAck ? "Confirm the change to continue." : null,
    ]);
  }
  if (code === "VALIDATION_ERROR") {
    const maxMb = numberDetail(details, "max_upload_size_mb");
    if (maxMb != null) {
      return `Files must be ${maxMb} MB or smaller.`;
    }
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
