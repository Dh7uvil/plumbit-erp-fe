"use client";

import { useQuery } from "@tanstack/react-query";

import { priceListsApi } from "@/modules/inventory-management/price-lists/api";
import type { PriceListListParams } from "@/modules/inventory-management/price-lists/schemas";

export const priceListKeys = {
  all: ["price-lists"] as const,
  list: (params: PriceListListParams) => [...priceListKeys.all, "list", params] as const,
  allItems: () => [...priceListKeys.all, "all"] as const,
  detail: (id: string) => [...priceListKeys.all, "detail", id] as const,
};

export function usePriceLists(params: PriceListListParams) {
  return useQuery({
    queryKey: priceListKeys.list(params),
    queryFn: () => priceListsApi.list(params),
  });
}

export function useAllPriceLists(enabled = true) {
  return useQuery({
    queryKey: priceListKeys.allItems(),
    queryFn: priceListsApi.listAll,
    enabled,
  });
}

export function usePriceList(id: string | null) {
  return useQuery({
    queryKey: priceListKeys.detail(id ?? ""),
    queryFn: () => priceListsApi.get(id!),
    enabled: Boolean(id),
  });
}
