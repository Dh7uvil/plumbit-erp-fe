"use client";

import { useQuery } from "@tanstack/react-query";

import { exchangeRatesApi } from "@/modules/erp/exchange-rates/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export type PickExchangeRateInput = {
  currencyId: string | null | undefined;
  baseCurrencyId: string | null | undefined;
  documentDate: string | null | undefined;
  savedRate?: string | null;
  savedCurrencyId?: string | null;
  savedDate?: string | null;
};

export type PickExchangeRateResult =
  | { mode: "same_currency"; rate: "1" }
  | { mode: "use_saved"; rate: string }
  | { mode: "fetch" }
  | { mode: "missing_inputs" };

export function pickExchangeRate(input: PickExchangeRateInput): PickExchangeRateResult {
  const { currencyId, baseCurrencyId, documentDate, savedRate, savedCurrencyId, savedDate } =
    input;

  if (!currencyId || !baseCurrencyId || currencyId === baseCurrencyId) {
    return { mode: "same_currency", rate: "1" };
  }

  const trimmedSavedRate = savedRate?.trim();
  if (
    trimmedSavedRate &&
    savedCurrencyId === currencyId &&
    savedDate &&
    documentDate &&
    savedDate === documentDate
  ) {
    return { mode: "use_saved", rate: trimmedSavedRate };
  }

  if (currencyId && baseCurrencyId && documentDate?.trim()) {
    return { mode: "fetch" };
  }

  return { mode: "missing_inputs" };
}

export function documentTotalsRateStatusMessage(params: {
  sameCurrency: boolean;
  isLoading: boolean;
  isError: boolean;
  rate: string | null | undefined;
}): string | null {
  if (params.sameCurrency) {
    return null;
  }
  if (params.isLoading) {
    return "Resolving exchange rate…";
  }
  if (params.isError || !params.rate) {
    return "No exchange rate for this date.";
  }
  return null;
}

export function savedDocumentDateFromRecord(
  record: Record<string, unknown> | null | undefined,
): string | null {
  if (!record) {
    return null;
  }
  for (const key of [
    "order_date",
    "invoice_date",
    "quote_date",
    "proforma_date",
    "credit_note_date",
    "debit_note_date",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

export function useResolvedExchangeRate(input: PickExchangeRateInput) {
  const pick = pickExchangeRate(input);

  const resolveKey = useTenantQueryKey([
    "exchange-rate-resolve",
    input.currencyId ?? "",
    input.baseCurrencyId ?? "",
    input.documentDate ?? "",
  ]);

  const resolveQuery = useQuery({
    queryKey: resolveKey,
    queryFn: () =>
      exchangeRatesApi.resolve({
        from_currency_id: input.currencyId!,
        to_currency_id: input.baseCurrencyId!,
        on_date: input.documentDate!,
      }),
    enabled: pick.mode === "fetch",
  });

  if (pick.mode === "same_currency") {
    return {
      rate: "1" as const,
      sameCurrency: true,
      isLoading: false,
      isError: false,
    };
  }

  if (pick.mode === "use_saved") {
    return {
      rate: pick.rate,
      sameCurrency: false,
      isLoading: false,
      isError: false,
    };
  }

  if (pick.mode === "missing_inputs") {
    return {
      rate: null,
      sameCurrency: false,
      isLoading: false,
      isError: true,
    };
  }

  const rate = resolveQuery.data?.rate ?? null;
  return {
    rate,
    sameCurrency: false,
    isLoading: resolveQuery.isLoading,
    isError: resolveQuery.isError || !rate,
  };
}
