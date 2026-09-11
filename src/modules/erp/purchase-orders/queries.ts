"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { purchaseOrdersApi } from "@/modules/erp/purchase-orders/api";
import type { PurchaseOrderListParams } from "@/modules/erp/purchase-orders/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (params: PurchaseOrderListParams) => [...purchaseOrderKeys.all, "list", params] as const,
  detail: (id: string) => [...purchaseOrderKeys.all, "detail", id] as const,
  composeDefaults: (supplierId: string) =>
    [...purchaseOrderKeys.all, "compose-defaults", supplierId] as const,
};

export function usePurchaseOrders(params: PurchaseOrderListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseOrderKeys.list(params)),
    queryFn: () => purchaseOrdersApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseOrderKeys.detail(id ?? "")),
    queryFn: () => purchaseOrdersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function usePurchaseOrderComposeDefaults(supplierId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseOrderKeys.composeDefaults(supplierId ?? "")),
    queryFn: () => purchaseOrdersApi.composeDefaults(supplierId!),
    enabled: Boolean(supplierId),
  });
}
