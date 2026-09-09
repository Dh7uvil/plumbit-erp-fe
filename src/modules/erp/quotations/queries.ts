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
  revisions: (id: string) => [...quotationKeys.all, "revisions", id] as const,
  revision: (id: string, revisionNumber: number) =>
    [...quotationKeys.all, "revision", id, revisionNumber] as const,
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

export function useQuotationRevisions(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(quotationKeys.revisions(id ?? "")),
    queryFn: () => quotationsApi.listRevisions(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useQuotationRevision(
  id: string | null,
  revisionNumber: number | null,
) {
  return useQuery({
    queryKey: useTenantQueryKey(quotationKeys.revision(id ?? "", revisionNumber ?? 0)),
    queryFn: () => quotationsApi.getRevision(id!, revisionNumber!),
    enabled: Boolean(id) && revisionNumber !== null,
  });
}
