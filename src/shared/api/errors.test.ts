import { describe, expect, it } from "vitest";

import { ApiError, FALLBACK_ERROR_MESSAGE, getErrorMessage } from "@/shared/api/errors";

describe("getErrorMessage", () => {
  it("maps known codes to user copy", () => {
    expect(getErrorMessage("DOCUMENT_STALE")).toBe(
      "This document changed since you opened it. Reload and try again.",
    );
    expect(getErrorMessage("EXCHANGE_RATE_MISSING")).toBe(
      "No exchange rate is recorded for this currency and date.",
    );
    expect(getErrorMessage("PERIOD_LOCKED")).toBe(
      "This date falls in a locked period and cannot be changed.",
    );
    expect(getErrorMessage("FINANCIAL_TRANSACTION_LOCKED")).toBe(
      "This record is posted and can no longer be changed.",
    );
  });

  it("surfaces the server upload size limit", () => {
    expect(
      getErrorMessage(
        new ApiError("VALIDATION_ERROR", "ignored", 400, {
          max_upload_size_mb: 25,
          size_bytes: 30 * 1024 * 1024,
        }),
      ),
    ).toBe("Files must be 25 MB or smaller.");
  });

  it("appends warehouse and qty from insufficient-stock details", () => {
    expect(
      getErrorMessage(
        new ApiError("INVENTORY_INSUFFICIENT_STOCK", "ignored", 409, {
          warehouse_code: "MAIN",
          available_qty: "2",
          requested_qty: "10",
        }),
      ),
    ).toBe(
      "There is not enough stock to complete this action. Warehouse MAIN. Available 2. Requested 10.",
    );
  });

  it("appends lock dates from period-lock details", () => {
    expect(
      getErrorMessage(
        new ApiError("PERIOD_LOCKED", "ignored", 409, {
          lock_date: "2026-01-31",
          hard_lock_date: "2026-02-28",
          document_date: "2026-01-15",
        }),
      ),
    ).toBe(
      "This date falls in a locked period and cannot be changed. Lock date 2026-01-31. Hard lock 2026-02-28. Document date 2026-01-15.",
    );
  });

  it("appends tier and reason from period-lock details", () => {
    expect(
      getErrorMessage(
        new ApiError("PERIOD_LOCKED", "ignored", 409, {
          lock_date: "2026-01-31",
          document_date: "2026-01-15",
          tier: "soft",
          reason: "Month-end close",
        }),
      ),
    ).toBe(
      "This date falls in a locked period and cannot be changed. Lock date 2026-01-31. Document date 2026-01-15. Transactions locked. Month-end close.",
    );
    expect(
      getErrorMessage(
        new ApiError("PERIOD_LOCKED", "ignored", 409, {
          hard_lock_date: "2026-02-28",
          document_date: "2026-01-15",
          tier: "hard",
          reason: "VAT return filed",
        }),
      ),
    ).toBe(
      "This date falls in a locked period and cannot be changed. Hard lock 2026-02-28. Document date 2026-01-15. Books closed. VAT return filed.",
    );
  });

  it("appends balances and reason from a blocked period lock", () => {
    expect(
      getErrorMessage(
        new ApiError("PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK", "ignored", 409, {
          reason: "negative_stock_disallowed",
          balances: [{ warehouse_code: "MAIN", sku: "PIPE-1", qty_on_hand: "-2" }],
          total_count: 1,
        }),
      ),
    ).toBe(
      "The period cannot be locked while stock is negative. Negative stock is not allowed. MAIN PIPE-1 -2.",
    );
    expect(
      getErrorMessage(
        new ApiError("PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK", "ignored", 409, {
          reason: "acknowledgement_required",
          balances: [
            { warehouse_code: "MAIN", sku: "PIPE-1", qty_on_hand: "-2" },
            { warehouse_code: "SITE", sku: "PIPE-2", qty_on_hand: "-1" },
          ],
          total_count: 4,
        }),
      ),
    ).toBe(
      "The period cannot be locked while stock is negative. Negative stock exists. Confirm to lock anyway. MAIN PIPE-1 -2; SITE PIPE-2 -1. 2 more.",
    );
  });

  it("reads the code from an ApiError", () => {
    expect(getErrorMessage(new ApiError("PERMISSION_DENIED", "ignored", 403))).toBe(
      "You do not have permission to perform this action.",
    );
  });

  it("falls back for unknown codes and non-errors", () => {
    expect(getErrorMessage("NOT_A_REAL_CODE")).toBe(FALLBACK_ERROR_MESSAGE);
    expect(getErrorMessage(new Error("boom"))).toBe(FALLBACK_ERROR_MESSAGE);
    expect(getErrorMessage(undefined)).toBe(FALLBACK_ERROR_MESSAGE);
  });
});
