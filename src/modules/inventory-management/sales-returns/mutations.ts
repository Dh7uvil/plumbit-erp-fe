"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deliveryNoteKeys } from "@/modules/inventory-management/delivery-notes/queries";
import { salesReturnsApi } from "@/modules/inventory-management/sales-returns/api";
import { salesReturnKeys } from "@/modules/inventory-management/sales-returns/queries";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateReturns(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: salesReturnKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: salesReturnKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: salesReturnKeys.detail(id) });
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesReturnsApi.create,
    onSuccess: async () => {
      await invalidateReturns(queryClient);
    },
  });
}

export function useUpdateSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof salesReturnsApi.update>[1];
      version: number;
    }) => salesReturnsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => salesReturnsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      salesReturnsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => salesReturnsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
