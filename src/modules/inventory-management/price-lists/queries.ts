"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { priceListsApi } from "@/modules/inventory-management/price-lists/api";
import type { PriceListListParams } from "@/modules/inventory-management/price-lists/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const priceListKeys = {
  all: ["price-lists"] as const,
  list: (params: PriceListListParams) => [...priceListKeys.all, "list", params] as const,
  allItems: () => [...priceListKeys.all, "all"] as const,
  detail: (id: string) => [...priceListKeys.all, "detail", id] as const,
};

export function usePriceLists(params: PriceListListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(priceListKeys.list(params)),
    queryFn: () => priceListsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllPriceLists(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(priceListKeys.allItems()),
    queryFn: priceListsApi.listAll,
    enabled,
  });
}

export function usePriceList(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(priceListKeys.detail(id ?? "")),
    queryFn: () => priceListsApi.get(id!),
    enabled: Boolean(id),
  });
}
