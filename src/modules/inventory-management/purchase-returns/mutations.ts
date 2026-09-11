"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { debitNoteKeys } from "@/modules/erp/debit-notes/queries";
import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { goodsReceiptKeys } from "@/modules/inventory-management/goods-receipts/queries";
import { purchaseReturnsApi } from "@/modules/inventory-management/purchase-returns/api";
import { purchaseReturnKeys } from "@/modules/inventory-management/purchase-returns/queries";
import { qualityInspectionKeys } from "@/modules/inventory-management/quality-inspections/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateReturns(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all });
  await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
  await queryClient.invalidateQueries({ queryKey: qualityInspectionKeys.all });
  await queryClient.invalidateQueries({ queryKey: debitNoteKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.detail(id) });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseReturnsApi.create,
    onSuccess: async () => {
      await invalidateReturns(queryClient);
    },
  });
}

export function useUpdatePurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof purchaseReturnsApi.update>[1];
      version: number;
    }) => purchaseReturnsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostPurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => purchaseReturnsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelPurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      purchaseReturnsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeletePurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => purchaseReturnsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReturns(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
