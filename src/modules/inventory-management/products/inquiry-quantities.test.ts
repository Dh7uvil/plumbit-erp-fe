import { describe, expect, it } from "vitest";

import {
  buildQuantityRows,
  formatUnit2PackageText,
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

describe("formatUnit2PackageText", () => {
  it("formats full packages only", () => {
    expect(formatUnit2PackageText("61", "0", "PCS", "CTN")).toBe("61.00 CTN");
  });

  it("formats packages and loose remainder", () => {
    expect(formatUnit2PackageText("2", "5", "PCS", "PKT")).toBe(
      "2.00 PKT & 5.00 PCS loose",
    );
  });

  it("formats quantity below one package", () => {
    expect(formatUnit2PackageText("0", "7", "PCS", "PKT")).toBe("7.00 PCS loose");
  });
});

describe("buildQuantityRows", () => {
  it("treats factor 1 as one piece per unit 2", () => {
    const rows = buildQuantityRows({
      qty_on_hand: "5000",
      qty_opened: "0",
      qty_committed: "0",
      net_available: "5000",
      secondary_unit_factor: "1",
    });
    expect(rows.on_hand?.unit2_qty).toBe("5000");
    expect(rows.on_hand?.remainder_qty).toBe("0");
  });

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
