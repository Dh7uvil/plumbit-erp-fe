"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { currenciesApi } from "@/modules/erp/currencies/api";
import { currencyKeys } from "@/modules/erp/currencies/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidateCurrencies(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: currencyKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: currenciesApi.create,
    onSuccess: async () => {
      await invalidateCurrencies(queryClient);
    },
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof currenciesApi.update>[1];
    }) => currenciesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCurrencies(queryClient);
      await queryClient.invalidateQueries({ queryKey: currencyKeys.detail(id) });
    },
  });
}

export function useDeleteCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: currenciesApi.delete,
    onSuccess: async () => {
      await invalidateCurrencies(queryClient);
    },
  });
}
