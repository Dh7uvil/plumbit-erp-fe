"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { stockAdjustmentsApi } from "@/modules/inventory-management/stock-adjustments/api";
import { stockAdjustmentKeys } from "@/modules/inventory-management/stock-adjustments/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateAdjustments(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.detail(id) });
  }
  if (stockMoved) {
    await queryClient.invalidateQueries({ queryKey: stockKeys.all });
  }
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.detail(id) });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockAdjustmentsApi.create,
    onSuccess: async () => {
      await invalidateAdjustments(queryClient);
    },
  });
}

export function useUpdateStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof stockAdjustmentsApi.update>[1];
      version: number;
    }) => stockAdjustmentsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateAdjustments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => stockAdjustmentsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateAdjustments(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      stockAdjustmentsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateAdjustments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCloneStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockAdjustmentsApi.clone,
    onSuccess: async () => {
      await invalidateAdjustments(queryClient);
    },
  });
}

export function useDeleteStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => stockAdjustmentsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateAdjustments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
