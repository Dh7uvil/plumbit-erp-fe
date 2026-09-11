"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { proformaInvoiceKeys } from "@/modules/erp/proforma-invoices/queries";
import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { salesOrdersApi } from "@/modules/erp/sales-orders/api";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type SalesOrderWriteVars = { id: string; version: number; creditOverride?: string | null };

async function invalidateSalesOrders(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) });
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
  stockMoved = false,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: SalesOrderWriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id, stockMoved);
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
  return useSalesOrderVersionMutation(salesOrdersApi.reopen, true);
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, creditOverride }: SalesOrderWriteVars) =>
      salesOrdersApi.confirm(id, { version, creditOverride }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCloseSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.close, true);
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: SalesOrderWriteVars & { reason?: string | null }) =>
      salesOrdersApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id, true);
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

export function useAcknowledgeSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.acknowledge);
}

export function useConvertSalesOrderToProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      values,
    }: SalesOrderWriteVars & {
      values?: Parameters<typeof salesOrdersApi.convertToProformaInvoice>[1]["values"];
    }) => salesOrdersApi.convertToProformaInvoice(id, { version, values }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: proformaInvoiceKeys.all });
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCreatePurchaseOrdersFromSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof salesOrdersApi.createPurchaseOrders>[1];
    }) => salesOrdersApi.createPurchaseOrders(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesOrders(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: salesOrderKeys.coverage(id) });
      await queryClient.invalidateQueries({ queryKey: salesOrderKeys.purchaseOrderPlan(id) });
      await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useDeleteSalesOrder() {
  return useSalesOrderVersionMutation(salesOrdersApi.delete);
}
