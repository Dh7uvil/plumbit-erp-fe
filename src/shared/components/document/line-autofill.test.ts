import { describe, expect, it } from "vitest";

import {
  defaultDocumentLineUnitId,
  productLineAutofillValues,
} from "@/shared/components/document/line-autofill";

const baseId = "11111111-1111-4111-8111-111111111111";
const pcsUnit2Id = "22222222-2222-4222-8222-222222222222";
const ctnUnit2Id = "33333333-3333-4333-8333-333333333333";

describe("defaultDocumentLineUnitId", () => {
  it("prefers unit 2 when its code is PCS", () => {
    const unitId = defaultDocumentLineUnitId(
      { unit_id: baseId, secondary_unit_id: pcsUnit2Id },
      (id) => (id === pcsUnit2Id ? "PCS" : "CTN"),
    );
    expect(unitId).toBe(pcsUnit2Id);
  });

  it("uses base unit when base is PCS and unit 2 is not", () => {
    const unitId = defaultDocumentLineUnitId(
      { unit_id: baseId, secondary_unit_id: ctnUnit2Id },
      (id) => (id === baseId ? "PCS" : "CTN"),
    );
    expect(unitId).toBe(baseId);
  });

  it("falls back to base unit when neither is PCS", () => {
    const unitId = defaultDocumentLineUnitId(
      { unit_id: baseId, secondary_unit_id: ctnUnit2Id },
      () => "CTN",
    );
    expect(unitId).toBe(baseId);
  });
});

describe("productLineAutofillValues", () => {
  it("applies PCS unit 2 default when codes are provided", () => {
    const values = productLineAutofillValues(
      {
        name: "Widget",
        purchase_rate: "10",
        unit_id: baseId,
        secondary_unit_id: pcsUnit2Id,
        tax_id: null,
      },
      "purchase",
      { codeForUnitId: (id) => (id === pcsUnit2Id ? "PCS" : "CTN") },
    );
    expect(values.unit_id).toBe(pcsUnit2Id);
  });
});
