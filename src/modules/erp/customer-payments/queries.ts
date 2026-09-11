"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { customerPaymentsApi } from "@/modules/erp/customer-payments/api";
import type { CustomerPaymentListParams } from "@/modules/erp/customer-payments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const customerPaymentKeys = {
  all: ["customer-payments"] as const,
  list: (params: CustomerPaymentListParams) =>
    [...customerPaymentKeys.all, "list", params] as const,
  detail: (id: string) => [...customerPaymentKeys.all, "detail", id] as const,
};

export function useCustomerPayments(params: CustomerPaymentListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(customerPaymentKeys.list(params)),
    queryFn: () => customerPaymentsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCustomerPayment(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(customerPaymentKeys.detail(id ?? "")),
    queryFn: () => customerPaymentsApi.get(id!),
    enabled: Boolean(id),
  });
}
