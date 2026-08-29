"use client";

import { useQuery } from "@tanstack/react-query";

import { taxesApi } from "@/modules/erp/accounting/taxes/api";
import type { TaxListParams } from "@/modules/erp/accounting/taxes/schemas";

export const taxKeys = {
  all: ["taxes"] as const,
  list: (params: TaxListParams) => [...taxKeys.all, "list", params] as const,
  allItems: () => [...taxKeys.all, "all"] as const,
  detail: (id: string) => [...taxKeys.all, "detail", id] as const,
};

export function useTaxes(params: TaxListParams) {
  return useQuery({
    queryKey: taxKeys.list(params),
    queryFn: () => taxesApi.list(params),
  });
}

export function useAllTaxes(enabled = true) {
  return useQuery({
    queryKey: taxKeys.allItems(),
    queryFn: taxesApi.listAll,
    enabled,
  });
}

export function useTax(id: string | null) {
  return useQuery({
    queryKey: taxKeys.detail(id ?? ""),
    queryFn: () => taxesApi.get(id!),
    enabled: Boolean(id),
  });
}
