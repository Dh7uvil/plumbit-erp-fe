import { describe, expect, it } from "vitest";

import { applyRoundOff, computeLiveDocumentTotals } from "@/shared/lib/document-totals";

describe("computeLiveDocumentTotals", () => {
  it("matches a simple taxable line", () => {
    const result = computeLiveDocumentTotals({
      lines: [{ quantity: "10", rate: "100", tax_rate: "5" }],
      discountType: undefined,
      shippingAmount: "0",
      adjustmentAmount: "0",
    });
    expect(result.subtotal).toBe("1000.0000");
    expect(result.tax_amount).toBe("50.0000");
    expect(result.net_total).toBe("1050.0000");
  });
});

describe("applyRoundOff", () => {
  it("leaves total unchanged when rule is NONE", () => {
    expect(applyRoundOff("1050.3333", "NONE")).toEqual({
      roundOff: "0.0000",
      netTotal: "1050.3333",
    });
  });

  it("rounds to the nearest 0.05", () => {
    const { netTotal } = applyRoundOff("1050.03", "0.05");
    expect(netTotal).toBe("1050.0500");
  });
});
