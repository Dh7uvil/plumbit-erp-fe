"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productsApi } from "@/modules/inventory-management/products/api";
import { productKeys } from "@/modules/inventory-management/products/queries";

async function invalidateProducts(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: productKeys.all });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: async () => {
      await invalidateProducts(queryClient);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof productsApi.update>[1];
    }) => productsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateProducts(queryClient);
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: async () => {
      await invalidateProducts(queryClient);
    },
  });
}
