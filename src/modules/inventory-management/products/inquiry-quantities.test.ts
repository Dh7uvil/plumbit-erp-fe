import { describe, expect, it } from "vitest";

import {
  buildQuantityRows,
  quantityUnitBreakdown,
} from "@/modules/inventory-management/products/inquiry-quantities";

describe("quantityUnitBreakdown", () => {
  it("returns full qty in unit when no factor", () => {
    expect(quantityUnitBreakdown("12.5", null)).toEqual({
      unit_qty: "12.5",
      unit2_qty: "0",
      remainder_qty: "0",
    });
  });

  it("splits qty into unit2 and remainder", () => {
    expect(quantityUnitBreakdown("25", "10")).toEqual({
      unit_qty: "25",
      unit2_qty: "2",
      remainder_qty: "5",
    });
  });
});

describe("buildQuantityRows", () => {
  it("builds all four rows", () => {
    const rows = buildQuantityRows({
      qty_on_hand: "10",
      qty_opened: "2",
      qty_committed: "3",
      net_available: "5",
      secondary_unit_factor: "4",
    });
    expect(rows.on_hand?.unit2_qty).toBe("2");
    expect(rows.opened?.remainder_qty).toBe("2");
    expect(rows.committed?.unit2_qty).toBe("0");
    expect(rows.net_available?.unit2_qty).toBe("1");
  });
});
