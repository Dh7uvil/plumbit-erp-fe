"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { taxesApi } from "@/modules/erp/accounting/taxes/api";
import type { TaxListParams } from "@/modules/erp/accounting/taxes/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const taxKeys = {
  all: ["taxes"] as const,
  list: (params: TaxListParams) => [...taxKeys.all, "list", params] as const,
  allItems: () => [...taxKeys.all, "all"] as const,
  detail: (id: string) => [...taxKeys.all, "detail", id] as const,
};

export function useTaxes(params: TaxListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(taxKeys.list(params)),
    queryFn: () => taxesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllTaxes(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(taxKeys.allItems()),
    queryFn: taxesApi.listAll,
    enabled,
  });
}

export function useTax(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(taxKeys.detail(id ?? "")),
    queryFn: () => taxesApi.get(id!),
    enabled: Boolean(id),
  });
}
