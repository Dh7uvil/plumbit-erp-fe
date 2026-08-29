"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unitsApi } from "@/modules/inventory-management/units/api";
import { unitKeys } from "@/modules/inventory-management/units/queries";

async function invalidateUnits(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: unitKeys.all });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unitsApi.create,
    onSuccess: async () => {
      await invalidateUnits(queryClient);
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof unitsApi.update>[1] }) =>
      unitsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateUnits(queryClient);
      await queryClient.invalidateQueries({ queryKey: unitKeys.detail(id) });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unitsApi.delete,
    onSuccess: async () => {
      await invalidateUnits(queryClient);
    },
  });
}
