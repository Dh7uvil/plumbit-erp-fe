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
