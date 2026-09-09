"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { stockApi } from "@/modules/inventory-management/stock/api";
import type {
  StockListParams,
  StockMovementListParams,
} from "@/modules/inventory-management/stock/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const stockKeys = {
  all: ["stock"] as const,
  list: (params: StockListParams) => [...stockKeys.all, "list", params] as const,
  movements: (params: StockMovementListParams) => [...stockKeys.all, "movements", params] as const,
  layers: (balanceId: string) => [...stockKeys.all, "layers", balanceId] as const,
};

export function useStock(params: StockListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(stockKeys.list(params)),
    queryFn: () => stockApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStockMovements(params: StockMovementListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(stockKeys.movements(params)),
    queryFn: () => stockApi.listMovements(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStockLayers(balanceId: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(stockKeys.layers(balanceId ?? "")),
    queryFn: () => stockApi.listLayers(balanceId!),
    enabled: Boolean(balanceId) && enabled,
  });
}
