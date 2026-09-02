"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { stockAdjustmentsApi } from "@/modules/inventory-management/stock-adjustments/api";
import type { StockAdjustmentListParams } from "@/modules/inventory-management/stock-adjustments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const stockAdjustmentKeys = {
  all: ["stock-adjustments"] as const,
  list: (params: StockAdjustmentListParams) =>
    [...stockAdjustmentKeys.all, "list", params] as const,
  detail: (id: string) => [...stockAdjustmentKeys.all, "detail", id] as const,
};

export function useStockAdjustments(params: StockAdjustmentListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(stockAdjustmentKeys.list(params)),
    queryFn: () => stockAdjustmentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useStockAdjustment(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(stockAdjustmentKeys.detail(id ?? "")),
    queryFn: () => stockAdjustmentsApi.get(id!),
    enabled: Boolean(id),
  });
}
