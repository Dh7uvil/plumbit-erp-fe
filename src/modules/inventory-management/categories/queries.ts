"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory-management/categories/api";
import type { CategoryListParams } from "@/modules/inventory-management/categories/schemas";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params: CategoryListParams) => [...categoryKeys.all, "list", params] as const,
  allItems: () => [...categoryKeys.all, "all"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
};

export function useCategories(params: CategoryListParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesApi.list(params),
  });
}

export function useAllCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.allItems(),
    queryFn: categoriesApi.listAll,
    enabled,
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ""),
    queryFn: () => categoriesApi.get(id!),
    enabled: Boolean(id),
  });
}
