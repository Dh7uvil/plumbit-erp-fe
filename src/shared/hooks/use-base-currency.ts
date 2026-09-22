"use client";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";

export function useBaseCurrency() {
  const currenciesQuery = useAllCurrencies();
  const base = currenciesQuery.data?.find((currency) => currency.is_base);
  return {
    baseCurrencyId: base?.id,
    baseCurrencyCode: base?.code,
    isLoading: currenciesQuery.isLoading,
  };
}
