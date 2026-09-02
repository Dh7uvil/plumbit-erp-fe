"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { productsApi } from "@/modules/inventory-management/products/api";
import type { ProductListParams } from "@/modules/inventory-management/products/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductListParams) => [...productKeys.all, "list", params] as const,
  allItems: () => [...productKeys.all, "all"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(productKeys.list(params)),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllProducts(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(productKeys.allItems()),
    queryFn: productsApi.listAll,
    enabled,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(productKeys.detail(id ?? "")),
    queryFn: () => productsApi.get(id!),
    enabled: Boolean(id),
  });
}
