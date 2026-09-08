"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { salesOrdersApi } from "@/modules/erp/sales-orders/api";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { isApiError } from "@/shared/api/errors";

type SalesOrderWriteVars = { id: string; version: number };

async function invalidateSalesOrders(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesOrdersApi.create,
    onSuccess: async () => {
      await invalidateSalesOrders(queryClient);
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof salesOrdersApi.update>[1];
      version: number;
    }) => salesOrdersApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

function useSalesOrderVersionMutation(
  mutationFn: (
    id: string,
    options: { version: number },
  ) => ReturnType<typeof salesOrdersApi.submit>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: SalesOrderWriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useSubmitSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.submit);
}

export function useApproveSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.approve);
}

export function useRejectSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: SalesOrderWriteVars & { reason?: string | null }) =>
      salesOrdersApi.reject(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useReopenSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.reopen);
}

export function useConfirmSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.confirm);
}

export function useCloseSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.close);
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: SalesOrderWriteVars & { reason?: string | null }) =>
      salesOrdersApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCloneSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesOrdersApi.clone,
    onSuccess: async () => {
      await invalidateSalesOrders(queryClient);
    },
  });
}

export function useDeleteSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.delete);
}
