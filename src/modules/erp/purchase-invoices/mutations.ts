"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { reportKeys } from "@/modules/erp/accounting/reports/queries";
import { purchaseInvoicesApi } from "@/modules/erp/purchase-invoices/api";
import { purchaseInvoiceKeys } from "@/modules/erp/purchase-invoices/queries";
import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { goodsReceiptKeys } from "@/modules/inventory-management/goods-receipts/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  posted = false,
) {
  await queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(id) });
  }
  if (posted) {
    await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all });
    await queryClient.invalidateQueries({ queryKey: journalKeys.all });
    await queryClient.invalidateQueries({ queryKey: reportKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(id) });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseInvoicesApi.create,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useCreatePurchaseInvoiceFromPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseInvoicesApi.createFromPurchaseOrder,
    onSuccess: async () => {
      await invalidate(queryClient);
      await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useCreatePurchaseInvoiceFromGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseInvoicesApi.createFromGoodsReceipt,
    onSuccess: async () => {
      await invalidate(queryClient);
      await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all });
      await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof purchaseInvoicesApi.update>[1];
      version: number;
    }) => purchaseInvoicesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostPurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => purchaseInvoicesApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelPurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      purchaseInvoicesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeletePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => purchaseInvoicesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
