"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { stockTransfersApi } from "@/modules/inventory-management/stock-transfers/api";
import { stockTransferKeys } from "@/modules/inventory-management/stock-transfers/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateTransfers(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: stockTransferKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(id) });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockTransfersApi.create,
    onSuccess: async () => {
      await invalidateTransfers(queryClient);
    },
  });
}

export function useUpdateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof stockTransfersApi.update>[1];
      version: number;
    }) => stockTransfersApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateTransfers(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => stockTransfersApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateTransfers(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      stockTransfersApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateTransfers(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCloneStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockTransfersApi.clone,
    onSuccess: async () => {
      await invalidateTransfers(queryClient);
    },
  });
}

export function useDeleteStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => stockTransfersApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateTransfers(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
