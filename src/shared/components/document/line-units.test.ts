import { describe, expect, it } from "vitest";

import { convertLineUnit2SelectionToPieces } from "@/shared/components/document/line-units";

describe("convertLineUnit2SelectionToPieces", () => {
  const product = {
    unit_id: "11111111-1111-4111-8111-111111111111",
    secondary_unit_id: "22222222-2222-4222-8222-222222222222",
    secondary_unit_factor: "10",
  };

  it("returns null when unit is base unit", () => {
    expect(
      convertLineUnit2SelectionToPieces(product, product.unit_id, "2", "100"),
    ).toBeNull();
  });

  it("converts package unit 2 qty and rate to base pieces", () => {
    const result = convertLineUnit2SelectionToPieces(
      product,
      product.secondary_unit_id,
      "2",
      "1000",
      (id) => (id === product.secondary_unit_id ? "CTN" : "PCS"),
    );
    expect(result).not.toBeNull();
    expect(result?.unit_id).toBe(product.unit_id);
    expect(result?.quantity).toBe("20.000000");
    expect(result?.rate).toBe("100.0000");
  });

  it("keeps unit 2 when unit 2 is PCS", () => {
    const pcsUnit2 = {
      unit_id: "11111111-1111-4111-8111-111111111111",
      secondary_unit_id: "22222222-2222-4222-8222-222222222222",
      secondary_unit_factor: "10",
    };
    const result = convertLineUnit2SelectionToPieces(
      pcsUnit2,
      pcsUnit2.secondary_unit_id,
      "100",
      "5",
      (id) => (id === pcsUnit2.secondary_unit_id ? "PCS" : "CTN"),
    );
    expect(result).toEqual({
      unit_id: pcsUnit2.secondary_unit_id,
      quantity: "100",
      rate: "5",
    });
  });
});
