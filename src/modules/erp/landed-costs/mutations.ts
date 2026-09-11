"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { reportKeys } from "@/modules/erp/accounting/reports/queries";
import { landedCostKeys } from "@/modules/erp/landed-costs/queries";
import { landedCostsApi } from "@/modules/erp/landed-costs/api";
import { purchaseInvoiceKeys } from "@/modules/erp/purchase-invoices/queries";
import { goodsReceiptKeys } from "@/modules/inventory-management/goods-receipts/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateLandedCosts(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  posted = false,
) {
  await queryClient.invalidateQueries({ queryKey: landedCostKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: landedCostKeys.detail(id) });
  }
  if (posted) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockKeys.all }),
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all }),
      queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all }),
      queryClient.invalidateQueries({ queryKey: journalKeys.all }),
      queryClient.invalidateQueries({ queryKey: reportKeys.all }),
    ]);
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
  await queryClient.invalidateQueries({ queryKey: landedCostKeys.detail(id) });
}

export function useCreateLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landedCostsApi.create,
    onSuccess: async () => {
      await invalidateLandedCosts(queryClient);
    },
  });
}

export function useCreateLandedCostFromBills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landedCostsApi.createFromBills,
    onSuccess: async () => {
      await invalidateLandedCosts(queryClient);
    },
  });
}

export function useUpdateLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof landedCostsApi.update>[1];
      version: number;
    }) => landedCostsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateLandedCosts(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => landedCostsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateLandedCosts(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      landedCostsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateLandedCosts(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => landedCostsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateLandedCosts(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
