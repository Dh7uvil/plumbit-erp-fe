"use client";

import { useQuery } from "@tanstack/react-query";

import { exchangeRatesApi } from "@/modules/erp/exchange-rates/api";
import type { ExchangeRateListParams } from "@/modules/erp/exchange-rates/schemas";

export const exchangeRateKeys = {
  all: ["exchange-rates"] as const,
  list: (params: ExchangeRateListParams) => [...exchangeRateKeys.all, "list", params] as const,
  allItems: (params: ExchangeRateListParams = {}) =>
    [...exchangeRateKeys.all, "all", params] as const,
  detail: (id: string) => [...exchangeRateKeys.all, "detail", id] as const,
};

export function useExchangeRates(params: ExchangeRateListParams) {
  return useQuery({
    queryKey: exchangeRateKeys.list(params),
    queryFn: () => exchangeRatesApi.list(params),
  });
}

export function useAllExchangeRates(params: ExchangeRateListParams = {}, enabled = true) {
  return useQuery({
    queryKey: exchangeRateKeys.allItems(params),
    queryFn: () => exchangeRatesApi.listAll(params),
    enabled,
  });
}
