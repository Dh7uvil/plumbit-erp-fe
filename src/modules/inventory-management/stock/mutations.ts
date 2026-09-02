"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stockApi } from "@/modules/inventory-management/stock/api";
import { stockKeys } from "@/modules/inventory-management/stock/queries";

export function useUpdateStockReorder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      balanceId,
      values,
    }: {
      balanceId: string;
      values: Parameters<typeof stockApi.updateReorder>[1];
    }) => stockApi.updateReorder(balanceId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
    },
  });
}
