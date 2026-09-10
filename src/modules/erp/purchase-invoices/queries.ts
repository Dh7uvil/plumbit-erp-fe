"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { purchaseInvoicesApi } from "@/modules/erp/purchase-invoices/api";
import type { PurchaseInvoiceListParams } from "@/modules/erp/purchase-invoices/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const purchaseInvoiceKeys = {
  all: ["purchase-invoices"] as const,
  list: (params: PurchaseInvoiceListParams) =>
    [...purchaseInvoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...purchaseInvoiceKeys.all, "detail", id] as const,
};

export function usePurchaseInvoices(params: PurchaseInvoiceListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseInvoiceKeys.list(params)),
    queryFn: () => purchaseInvoicesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePurchaseInvoice(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(purchaseInvoiceKeys.detail(id ?? "")),
    queryFn: () => purchaseInvoicesApi.get(id!),
    enabled: Boolean(id),
  });
}
