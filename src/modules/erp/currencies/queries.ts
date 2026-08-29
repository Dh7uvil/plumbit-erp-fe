"use client";

import { useQuery } from "@tanstack/react-query";

import { currenciesApi } from "@/modules/erp/currencies/api";
import type { CurrencyListParams } from "@/modules/erp/currencies/schemas";

export const currencyKeys = {
  all: ["currencies"] as const,
  list: (params: CurrencyListParams) => [...currencyKeys.all, "list", params] as const,
  allItems: () => [...currencyKeys.all, "all"] as const,
  detail: (id: string) => [...currencyKeys.all, "detail", id] as const,
};

export function useCurrencies(params: CurrencyListParams) {
  return useQuery({
    queryKey: currencyKeys.list(params),
    queryFn: () => currenciesApi.list(params),
  });
}

export function useAllCurrencies(enabled = true) {
  return useQuery({
    queryKey: currencyKeys.allItems(),
    queryFn: currenciesApi.listAll,
    enabled,
  });
}

export function useCurrency(id: string | null) {
  return useQuery({
    queryKey: currencyKeys.detail(id ?? ""),
    queryFn: () => currenciesApi.get(id!),
    enabled: Boolean(id),
  });
}
