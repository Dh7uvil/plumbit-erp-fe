import { describe, expect, it } from "vitest";

import { formatSecondaryPackingLabel } from "@/modules/inventory-management/products/schemas";

describe("formatSecondaryPackingLabel", () => {
  it("uses PCS on the left for carton unit 2", () => {
    expect(formatSecondaryPackingLabel("200", "CTN", "CTN")).toBe("200.00 PCS / CTN");
  });

  it("shows piece per piece when unit 2 is PCS", () => {
    expect(formatSecondaryPackingLabel("1", "CTN", "PCS")).toBe("1.00 PCS / PCS");
  });

  it("defaults to 1 PCS / PCS when unit 2 is unset", () => {
    expect(formatSecondaryPackingLabel("", "CTN", null)).toBe("1.00 PCS / PCS");
  });
});
