"use client";

import { useQuery } from "@tanstack/react-query";

import { productsApi } from "@/modules/inventory-management/products/api";
import type { ProductListParams } from "@/modules/inventory-management/products/schemas";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductListParams) => [...productKeys.all, "list", params] as const,
  allItems: () => [...productKeys.all, "all"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.list(params),
  });
}

export function useAllProducts(enabled = true) {
  return useQuery({
    queryKey: productKeys.allItems(),
    queryFn: productsApi.listAll,
    enabled,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => productsApi.get(id!),
    enabled: Boolean(id),
  });
}
