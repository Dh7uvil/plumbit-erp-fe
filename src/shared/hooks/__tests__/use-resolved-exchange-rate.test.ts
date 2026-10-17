import { describe, expect, it } from "vitest";

import {
  documentTotalsRateStatusMessage,
  pickExchangeRate,
} from "@/shared/hooks/use-resolved-exchange-rate";

const usd = "11111111-1111-1111-1111-111111111111";
const aed = "22222222-2222-2222-2222-222222222222";

describe("pickExchangeRate", () => {
  it("returns same_currency when document currency is base currency", () => {
    expect(
      pickExchangeRate({
        currencyId: aed,
        baseCurrencyId: aed,
        documentDate: "2026-01-15",
      }),
    ).toEqual({ mode: "same_currency", rate: "1" });
  });

  it("returns same_currency when currency or base is missing", () => {
    expect(
      pickExchangeRate({
        currencyId: null,
        baseCurrencyId: aed,
        documentDate: "2026-01-15",
      }),
    ).toEqual({ mode: "same_currency", rate: "1" });
  });

  it("reuses saved rate when currency and date match", () => {
    expect(
      pickExchangeRate({
        currencyId: usd,
        baseCurrencyId: aed,
        documentDate: "2026-01-15",
        savedRate: "3.6725",
        savedCurrencyId: usd,
        savedDate: "2026-01-15",
      }),
    ).toEqual({ mode: "use_saved", rate: "3.6725" });
  });

  it("fetches when currency changed from saved document", () => {
    expect(
      pickExchangeRate({
        currencyId: usd,
        baseCurrencyId: aed,
        documentDate: "2026-01-15",
        savedRate: "3.6725",
        savedCurrencyId: aed,
        savedDate: "2026-01-15",
      }),
    ).toEqual({ mode: "fetch" });
  });

  it("fetches when date changed from saved document", () => {
    expect(
      pickExchangeRate({
        currencyId: usd,
        baseCurrencyId: aed,
        documentDate: "2026-01-16",
        savedRate: "3.6725",
        savedCurrencyId: usd,
        savedDate: "2026-01-15",
      }),
    ).toEqual({ mode: "fetch" });
  });

  it("returns missing_inputs when foreign currency but no date", () => {
    expect(
      pickExchangeRate({
        currencyId: usd,
        baseCurrencyId: aed,
        documentDate: "",
        savedRate: null,
      }),
    ).toEqual({ mode: "missing_inputs" });
  });
});

describe("documentTotalsRateStatusMessage", () => {
  it("returns null for same-currency documents", () => {
    expect(
      documentTotalsRateStatusMessage({
        sameCurrency: true,
        isLoading: true,
        isError: true,
        rate: null,
      }),
    ).toBeNull();
  });

  it("shows loading and missing-rate messages for foreign currency", () => {
    expect(
      documentTotalsRateStatusMessage({
        sameCurrency: false,
        isLoading: true,
        isError: false,
        rate: null,
      }),
    ).toBe("Resolving exchange rate…");

    expect(
      documentTotalsRateStatusMessage({
        sameCurrency: false,
        isLoading: false,
        isError: true,
        rate: null,
      }),
    ).toBe("No exchange rate for this date.");
  });
});
