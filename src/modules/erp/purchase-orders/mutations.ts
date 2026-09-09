"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { purchaseOrdersApi } from "@/modules/erp/purchase-orders/api";
import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type PurchaseOrderWriteVars = { id: string; version: number };

async function invalidatePurchaseOrders(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: stockKeys.all });
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrdersApi.create,
    onSuccess: async () => {
      await invalidatePurchaseOrders(queryClient);
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof purchaseOrdersApi.update>[1];
      version: number;
    }) => purchaseOrdersApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePurchaseOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

function usePurchaseOrderVersionMutation(
  mutationFn: (
    id: string,
    options: { version: number },
  ) => ReturnType<typeof purchaseOrdersApi.submit>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: PurchaseOrderWriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePurchaseOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useSubmitPurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.submit);
}

export function useApprovePurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.approve);
}

export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: PurchaseOrderWriteVars & { reason?: string | null }) =>
      purchaseOrdersApi.reject(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidatePurchaseOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useReopenPurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.reopen);
}

export function useIssuePurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.issue);
}

export function useClosePurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.close);
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: PurchaseOrderWriteVars & { reason?: string | null }) =>
      purchaseOrdersApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidatePurchaseOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useClonePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrdersApi.clone,
    onSuccess: async () => {
      await invalidatePurchaseOrders(queryClient);
    },
  });
}

export function useDeletePurchaseOrder() {
  return usePurchaseOrderVersionMutation(purchaseOrdersApi.delete);
}
