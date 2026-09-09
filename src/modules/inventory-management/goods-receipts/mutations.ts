"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { goodsReceiptsApi } from "@/modules/inventory-management/goods-receipts/api";
import { goodsReceiptKeys } from "@/modules/inventory-management/goods-receipts/queries";
import { qualityInspectionKeys } from "@/modules/inventory-management/quality-inspections/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateReceipts(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
  await queryClient.invalidateQueries({ queryKey: qualityInspectionKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(id) });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goodsReceiptsApi.create,
    onSuccess: async () => {
      await invalidateReceipts(queryClient);
    },
  });
}

export function useCreateGoodsReceiptFromPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goodsReceiptsApi.createFromPurchaseOrder,
    onSuccess: async () => {
      await invalidateReceipts(queryClient);
    },
  });
}

export function useUpdateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof goodsReceiptsApi.update>[1];
      version: number;
    }) => goodsReceiptsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReceipts(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => goodsReceiptsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReceipts(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      goodsReceiptsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateReceipts(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => goodsReceiptsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateReceipts(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
