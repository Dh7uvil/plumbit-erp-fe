import { describe, expect, it } from "vitest";

import { shouldShowBaseCurrencyLine } from "@/shared/components/money/money-with-base";

describe("shouldShowBaseCurrencyLine", () => {
  it("hides the base line when currencies match", () => {
    expect(shouldShowBaseCurrencyLine("AED", "AED", "100.00")).toBe(false);
  });

  it("shows the base line for foreign currency with a base amount", () => {
    expect(shouldShowBaseCurrencyLine("USD", "AED", "3672.50")).toBe(true);
  });

  it("hides the base line when base amount or code is missing", () => {
    expect(shouldShowBaseCurrencyLine("USD", "", "3672.50")).toBe(false);
    expect(shouldShowBaseCurrencyLine("USD", "AED", null)).toBe(false);
  });
});
