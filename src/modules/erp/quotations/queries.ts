"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { quotationsApi } from "@/modules/erp/quotations/api";
import type { QuotationListParams } from "@/modules/erp/quotations/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const quotationKeys = {
  all: ["quotations"] as const,
  list: (params: QuotationListParams) => [...quotationKeys.all, "list", params] as const,
  detail: (id: string) => [...quotationKeys.all, "detail", id] as const,
  composeDefaults: (customerId: string) =>
    [...quotationKeys.all, "compose-defaults", customerId] as const,
};

export function useQuotations(params: QuotationListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(quotationKeys.list(params)),
    queryFn: () => quotationsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useQuotation(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(quotationKeys.detail(id ?? "")),
    queryFn: () => quotationsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useQuotationComposeDefaults(customerId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(quotationKeys.composeDefaults(customerId ?? "")),
    queryFn: () => quotationsApi.composeDefaults(customerId!),
    enabled: Boolean(customerId),
  });
}
