"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory-management/categories/api";
import type { CategoryListParams } from "@/modules/inventory-management/categories/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params: CategoryListParams) => [...categoryKeys.all, "list", params] as const,
  allItems: () => [...categoryKeys.all, "all"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
};

export function useCategories(params: CategoryListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(categoryKeys.list(params)),
    queryFn: () => categoriesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllCategories(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(categoryKeys.allItems()),
    queryFn: categoriesApi.listAll,
    enabled,
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(categoryKeys.detail(id ?? "")),
    queryFn: () => categoriesApi.get(id!),
    enabled: Boolean(id),
  });
}
