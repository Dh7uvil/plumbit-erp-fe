"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { costCentersApi } from "@/modules/erp/accounting/cost-centers/api";
import { costCenterKeys } from "@/modules/erp/accounting/cost-centers/queries";

async function invalidateCostCenters(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: costCenterKeys.all });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: costCentersApi.create,
    onSuccess: async () => {
      await invalidateCostCenters(queryClient);
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof costCentersApi.update>[1];
    }) => costCentersApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCostCenters(queryClient);
      await queryClient.invalidateQueries({ queryKey: costCenterKeys.detail(id) });
    },
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: costCentersApi.delete,
    onSuccess: async () => {
      await invalidateCostCenters(queryClient);
    },
  });
}
