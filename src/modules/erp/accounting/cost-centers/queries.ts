"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { costCentersApi } from "@/modules/erp/accounting/cost-centers/api";
import type { CostCenterListParams } from "@/modules/erp/accounting/cost-centers/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const costCenterKeys = {
  all: ["cost-centers"] as const,
  list: (params: CostCenterListParams) => [...costCenterKeys.all, "list", params] as const,
  allItems: () => [...costCenterKeys.all, "all"] as const,
  detail: (id: string) => [...costCenterKeys.all, "detail", id] as const,
};

export function useCostCenters(params: CostCenterListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(costCenterKeys.list(params)),
    queryFn: () => costCentersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllCostCenters(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(costCenterKeys.allItems()),
    queryFn: costCentersApi.listAll,
    enabled,
  });
}

export function useCostCenter(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(costCenterKeys.detail(id ?? "")),
    queryFn: () => costCentersApi.get(id!),
    enabled: Boolean(id),
  });
}
