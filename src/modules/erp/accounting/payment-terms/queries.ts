"use client";

import { useQuery } from "@tanstack/react-query";

import { paymentTermsApi } from "@/modules/erp/accounting/payment-terms/api";
import type { PaymentTermListParams } from "@/modules/erp/accounting/payment-terms/schemas";

export const paymentTermKeys = {
  all: ["payment-terms"] as const,
  list: (params: PaymentTermListParams) => [...paymentTermKeys.all, "list", params] as const,
  allItems: () => [...paymentTermKeys.all, "all"] as const,
  detail: (id: string) => [...paymentTermKeys.all, "detail", id] as const,
};

export function usePaymentTerms(params: PaymentTermListParams) {
  return useQuery({
    queryKey: paymentTermKeys.list(params),
    queryFn: () => paymentTermsApi.list(params),
  });
}

export function useAllPaymentTerms(enabled = true) {
  return useQuery({
    queryKey: paymentTermKeys.allItems(),
    queryFn: paymentTermsApi.listAll,
    enabled,
  });
}

export function usePaymentTerm(id: string | null) {
  return useQuery({
    queryKey: paymentTermKeys.detail(id ?? ""),
    queryFn: () => paymentTermsApi.get(id!),
    enabled: Boolean(id),
  });
}
