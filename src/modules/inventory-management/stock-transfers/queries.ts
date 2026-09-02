"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { stockTransfersApi } from "@/modules/inventory-management/stock-transfers/api";
import type { StockTransferListParams } from "@/modules/inventory-management/stock-transfers/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const stockTransferKeys = {
  all: ["stock-transfers"] as const,
  list: (params: StockTransferListParams) => [...stockTransferKeys.all, "list", params] as const,
  detail: (id: string) => [...stockTransferKeys.all, "detail", id] as const,
};

export function useStockTransfers(params: StockTransferListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(stockTransferKeys.list(params)),
    queryFn: () => stockTransfersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useStockTransfer(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(stockTransferKeys.detail(id ?? "")),
    queryFn: () => stockTransfersApi.get(id!),
    enabled: Boolean(id),
  });
}
