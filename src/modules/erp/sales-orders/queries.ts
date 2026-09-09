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
  customerPo: (customerId: string, poNumber: string, excludeId?: string) =>
    [...salesOrderKeys.all, "customer-po", customerId, poNumber, excludeId ?? ""] as const,
  coverage: (id: string) => [...salesOrderKeys.all, "coverage", id] as const,
  purchaseOrderPlan: (id: string) => [...salesOrderKeys.all, "po-plan", id] as const,
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

export function useCustomerPoDuplicates(
  params: { customer_id: string | null; customer_po_number: string; exclude_id?: string },
  enabled = true,
) {
  const customerId = params.customer_id ?? "";
  const poNumber = params.customer_po_number.trim();
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.customerPo(customerId, poNumber, params.exclude_id)),
    queryFn: () =>
      salesOrdersApi.checkCustomerPo({
        customer_id: customerId,
        customer_po_number: poNumber,
        exclude_id: params.exclude_id,
      }),
    enabled: enabled && Boolean(customerId) && Boolean(poNumber),
  });
}

export function useSalesOrderCoverage(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.coverage(id ?? "")),
    queryFn: () => salesOrdersApi.getCoverage(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useSalesOrderPurchaseOrderPlan(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(salesOrderKeys.purchaseOrderPlan(id ?? "")),
    queryFn: () => salesOrdersApi.getPurchaseOrderPlan(id!),
    enabled: Boolean(id) && enabled,
  });
}
