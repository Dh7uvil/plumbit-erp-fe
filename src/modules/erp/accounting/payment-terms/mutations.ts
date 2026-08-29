"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { paymentTermsApi } from "@/modules/erp/accounting/payment-terms/api";
import { paymentTermKeys } from "@/modules/erp/accounting/payment-terms/queries";

async function invalidatePaymentTerms(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: paymentTermKeys.all });
}

export function useCreatePaymentTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentTermsApi.create,
    onSuccess: async () => {
      await invalidatePaymentTerms(queryClient);
    },
  });
}

export function useUpdatePaymentTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof paymentTermsApi.update>[1];
    }) => paymentTermsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePaymentTerms(queryClient);
      await queryClient.invalidateQueries({ queryKey: paymentTermKeys.detail(id) });
    },
  });
}

export function useDeletePaymentTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentTermsApi.delete,
    onSuccess: async () => {
      await invalidatePaymentTerms(queryClient);
    },
  });
}
