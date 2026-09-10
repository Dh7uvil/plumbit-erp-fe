"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { salesInvoicesApi } from "@/modules/erp/sales-invoices/api";
import type { SalesInvoiceListParams } from "@/modules/erp/sales-invoices/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const salesInvoiceKeys = {
  all: ["sales-invoices"] as const,
  list: (params: SalesInvoiceListParams) => [...salesInvoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...salesInvoiceKeys.all, "detail", id] as const,
  journal: (id: string) => [...salesInvoiceKeys.all, "journal", id] as const,
  margin: (id: string) => [...salesInvoiceKeys.all, "margin", id] as const,
};

export function useSalesInvoices(params: SalesInvoiceListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(salesInvoiceKeys.list(params)),
    queryFn: () => salesInvoicesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSalesInvoice(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(salesInvoiceKeys.detail(id ?? "")),
    queryFn: () => salesInvoicesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSalesInvoiceJournal(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(salesInvoiceKeys.journal(id ?? "")),
    queryFn: () => salesInvoicesApi.journal(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useSalesInvoiceMargin(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(salesInvoiceKeys.margin(id ?? "")),
    queryFn: () => salesInvoicesApi.margin(id!),
    enabled: Boolean(id) && enabled,
  });
}
