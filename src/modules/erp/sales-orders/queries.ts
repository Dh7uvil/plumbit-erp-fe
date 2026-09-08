"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { salesOrdersApi } from "@/modules/erp/sales-orders/api";
import type { SalesOrderListParams } from "@/modules/erp/sales-orders/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const salesOrderKeys = {
  all: ["sales-orders"] as const,
  list: (params: SalesOrderListParams) => [...salesOrderKeys.all, "list", params] as const,
  detail: (id: string) => [...salesOrderKeys.all, "detail", id] as const,
  composeDefaults: (customerId: string) =>
    [...salesOrderKeys.all, "compose-defaults", customerId] as const,
};

export function useSalesOrders(params: SalesOrderListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.list(params)),
    queryFn: () => salesOrdersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSalesOrder(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.detail(id ?? "")),
    queryFn: () => salesOrdersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSalesOrderComposeDefaults(customerId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.composeDefaults(customerId ?? "")),
    queryFn: () => salesOrdersApi.composeDefaults(customerId!),
    enabled: Boolean(customerId),
  });
}
