"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { goodsReceiptsApi } from "@/modules/inventory-management/goods-receipts/api";
import type { GoodsReceiptListParams } from "@/modules/inventory-management/goods-receipts/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const goodsReceiptKeys = {
  all: ["goods-receipts"] as const,
  list: (params: GoodsReceiptListParams) => [...goodsReceiptKeys.all, "list", params] as const,
  detail: (id: string) => [...goodsReceiptKeys.all, "detail", id] as const,
};

export function useGoodsReceipts(params: GoodsReceiptListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(goodsReceiptKeys.list(params)),
    queryFn: () => goodsReceiptsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGoodsReceipt(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(goodsReceiptKeys.detail(id ?? "")),
    queryFn: () => goodsReceiptsApi.get(id!),
    enabled: Boolean(id),
  });
}
