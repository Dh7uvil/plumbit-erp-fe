"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory-management/categories/api";
import { categoryKeys } from "@/modules/inventory-management/categories/queries";

async function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: async () => {
      await invalidateCategories(queryClient);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof categoriesApi.update>[1];
    }) => categoriesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCategories(queryClient);
      await queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: async () => {
      await invalidateCategories(queryClient);
    },
  });
}
