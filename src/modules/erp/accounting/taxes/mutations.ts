"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { taxesApi } from "@/modules/erp/accounting/taxes/api";
import { taxKeys } from "@/modules/erp/accounting/taxes/queries";

async function invalidateTaxes(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: taxKeys.all });
}

export function useCreateTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taxesApi.create,
    onSuccess: async () => {
      await invalidateTaxes(queryClient);
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof taxesApi.update>[1];
    }) => taxesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateTaxes(queryClient);
      await queryClient.invalidateQueries({ queryKey: taxKeys.detail(id) });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taxesApi.delete,
    onSuccess: async () => {
      await invalidateTaxes(queryClient);
    },
  });
}
