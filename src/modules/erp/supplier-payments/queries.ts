"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { supplierPaymentsApi } from "@/modules/erp/supplier-payments/api";
import type { SupplierPaymentListParams } from "@/modules/erp/supplier-payments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const supplierPaymentKeys = {
  all: ["supplier-payments"] as const,
  list: (params: SupplierPaymentListParams) =>
    [...supplierPaymentKeys.all, "list", params] as const,
  detail: (id: string) => [...supplierPaymentKeys.all, "detail", id] as const,
};

export function useSupplierPayments(params: SupplierPaymentListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(supplierPaymentKeys.list(params)),
    queryFn: () => supplierPaymentsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSupplierPayment(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(supplierPaymentKeys.detail(id ?? "")),
    queryFn: () => supplierPaymentsApi.get(id!),
    enabled: Boolean(id),
  });
}
