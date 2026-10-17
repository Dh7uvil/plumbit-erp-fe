import { describe, expect, it } from "vitest";

import { dualCurrencyBaseAmountForRow } from "@/shared/components/document/document-totals-panel";

describe("dualCurrencyBaseAmountForRow", () => {
  const baseAmount = "3672.5000";

  it("returns null when currencies match or rate is missing", () => {
    expect(dualCurrencyBaseAmountForRow("Subtotal", "1000.00", baseAmount, "3.6725", true)).toBeNull();
    expect(dualCurrencyBaseAmountForRow("Subtotal", "1000.00", baseAmount, null, false)).toBeNull();
    expect(dualCurrencyBaseAmountForRow("Subtotal", "1000.00", baseAmount, "", false)).toBeNull();
  });

  it("uses stored base_amount for net and grand total rows", () => {
    expect(dualCurrencyBaseAmountForRow("Net total", "1000.00", baseAmount, "3.6725", false)).toBe(
      baseAmount,
    );
    expect(
      dualCurrencyBaseAmountForRow("Grand total", "1000.00", baseAmount, "3.6725", false),
    ).toBe(baseAmount);
  });

  it("converts other rows with the exchange rate", () => {
    expect(dualCurrencyBaseAmountForRow("Subtotal", "1000.00", baseAmount, "3.6725", false)).toBe(
      "3672.5000",
    );
    expect(dualCurrencyBaseAmountForRow("Tax", "50.00", baseAmount, "3.6725", false)).toBe(
      "183.6250",
    );
  });
});
