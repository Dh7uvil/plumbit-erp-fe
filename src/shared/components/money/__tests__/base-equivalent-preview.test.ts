import { describe, expect, it } from "vitest";

import {
  baseEquivalentPreviewMessage,
  computeBaseEquivalentAmount,
} from "@/shared/components/money/base-equivalent-preview";

describe("baseEquivalentPreviewMessage", () => {
  it("returns null when the document is already in base currency", () => {
    expect(
      baseEquivalentPreviewMessage({
        sameCurrency: true,
        hasAmount: true,
        isLoading: false,
        isError: false,
        rate: "3.6725",
      }),
    ).toBeNull();
  });

  it("returns null when there is no amount to convert", () => {
    expect(
      baseEquivalentPreviewMessage({
        sameCurrency: false,
        hasAmount: false,
        isLoading: false,
        isError: false,
        rate: "3.6725",
      }),
    ).toBeNull();
  });

  it("shows a loading message while resolving", () => {
    expect(
      baseEquivalentPreviewMessage({
        sameCurrency: false,
        hasAmount: true,
        isLoading: true,
        isError: false,
        rate: undefined,
      }),
    ).toBe("Resolving exchange rate…");
  });

  it("shows a missing-rate message on error", () => {
    expect(
      baseEquivalentPreviewMessage({
        sameCurrency: false,
        hasAmount: true,
        isLoading: false,
        isError: true,
        rate: undefined,
      }),
    ).toBe("No exchange rate for this date.");
  });
});

describe("computeBaseEquivalentAmount", () => {
  it("multiplies amount by the resolved rate", () => {
    expect(computeBaseEquivalentAmount("1000.00", "3.6725")).toBe("3672.5000");
  });

  it("returns null for invalid input", () => {
    expect(computeBaseEquivalentAmount("", "3.6725")).toBeNull();
  });
});
