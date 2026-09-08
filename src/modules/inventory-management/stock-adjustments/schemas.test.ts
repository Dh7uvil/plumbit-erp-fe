import { describe, expect, it } from "vitest";

import {
  StockAdjustmentFormSchema,
  isBlankAdjustmentLine,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";

const warehouseId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";

function baseValues(overrides: Record<string, unknown> = {}) {
  return {
    warehouse_id: warehouseId,
    document_date: "2026-01-15",
    reason: "OPENING_STOCK",
    branch_id: OPTIONAL_SELECT_NONE,
    reference: "",
    notes: "",
    lines: [
      {
        product_id: productId,
        unit_id: OPTIONAL_SELECT_NONE,
        qty_delta: "10",
        qty_counted: "",
        notes: "",
      },
    ],
    ...overrides,
  };
}

describe("StockAdjustmentFormSchema", () => {
  it("accepts a signed opening-stock delta", () => {
    const parsed = StockAdjustmentFormSchema.safeParse(baseValues());
    expect(parsed.success).toBe(true);
  });

  it("rejects a zero delta for non-count reasons", () => {
    const parsed = StockAdjustmentFormSchema.safeParse(
      baseValues({
        lines: [
          {
            product_id: productId,
            unit_id: OPTIONAL_SELECT_NONE,
            qty_delta: "0",
            qty_counted: "",
            notes: "",
          },
        ],
      }),
    );
    expect(parsed.success).toBe(false);
  });

  it("requires counted quantity when reason is COUNT", () => {
    const missing = StockAdjustmentFormSchema.safeParse(
      baseValues({
        reason: "COUNT",
        lines: [
          {
            product_id: productId,
            unit_id: OPTIONAL_SELECT_NONE,
            qty_delta: "",
            qty_counted: "",
            notes: "",
          },
        ],
      }),
    );
    expect(missing.success).toBe(false);

    const counted = StockAdjustmentFormSchema.safeParse(
      baseValues({
        reason: "COUNT",
        lines: [
          {
            product_id: productId,
            unit_id: OPTIONAL_SELECT_NONE,
            qty_delta: "",
            qty_counted: "12.5",
            notes: "",
          },
        ],
      }),
    );
    expect(counted.success).toBe(true);
  });

  it("treats empty lines as blank", () => {
    expect(
      isBlankAdjustmentLine({
        product_id: OPTIONAL_SELECT_NONE,
        unit_id: OPTIONAL_SELECT_NONE,
        qty_delta: "",
        qty_counted: "",
        notes: "",
      }),
    ).toBe(true);
  });
});
