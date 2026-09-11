"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { proformaInvoicesApi } from "@/modules/erp/proforma-invoices/api";
import type { ProformaInvoiceListParams } from "@/modules/erp/proforma-invoices/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const proformaInvoiceKeys = {
  all: ["proforma-invoices"] as const,
  list: (params: ProformaInvoiceListParams) =>
    [...proformaInvoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...proformaInvoiceKeys.all, "detail", id] as const,
  composeDefaults: (customerId: string) =>
    [...proformaInvoiceKeys.all, "compose-defaults", customerId] as const,
};

export function useProformaInvoices(params: ProformaInvoiceListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(proformaInvoiceKeys.list(params)),
    queryFn: () => proformaInvoicesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProformaInvoice(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(proformaInvoiceKeys.detail(id ?? "")),
    queryFn: () => proformaInvoicesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useProformaInvoiceComposeDefaults(customerId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(proformaInvoiceKeys.composeDefaults(customerId ?? "")),
    queryFn: () => proformaInvoicesApi.composeDefaults(customerId!),
    enabled: Boolean(customerId),
  });
}
