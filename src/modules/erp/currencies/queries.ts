"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { currenciesApi } from "@/modules/erp/currencies/api";
import type { CurrencyListParams } from "@/modules/erp/currencies/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const currencyKeys = {
  all: ["currencies"] as const,
  list: (params: CurrencyListParams) => [...currencyKeys.all, "list", params] as const,
  allItems: () => [...currencyKeys.all, "all"] as const,
  detail: (id: string) => [...currencyKeys.all, "detail", id] as const,
};

export function useCurrencies(params: CurrencyListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(currencyKeys.list(params)),
    queryFn: () => currenciesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllCurrencies(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(currencyKeys.allItems()),
    queryFn: currenciesApi.listAll,
    enabled,
  });
}

export function useCurrency(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(currencyKeys.detail(id ?? "")),
    queryFn: () => currenciesApi.get(id!),
    enabled: Boolean(id),
  });
}
