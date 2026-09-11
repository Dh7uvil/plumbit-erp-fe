"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { purchaseReturnsApi } from "@/modules/inventory-management/purchase-returns/api";
import type { PurchaseReturnListParams } from "@/modules/inventory-management/purchase-returns/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const purchaseReturnKeys = {
  all: ["purchase-returns"] as const,
  list: (params: PurchaseReturnListParams) => [...purchaseReturnKeys.all, "list", params] as const,
  detail: (id: string) => [...purchaseReturnKeys.all, "detail", id] as const,
};

export function usePurchaseReturns(params: PurchaseReturnListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseReturnKeys.list(params)),
    queryFn: () => purchaseReturnsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePurchaseReturn(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseReturnKeys.detail(id ?? "")),
    queryFn: () => purchaseReturnsApi.get(id!),
    enabled: Boolean(id),
  });
}
