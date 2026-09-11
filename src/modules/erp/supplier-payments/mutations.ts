"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { reportKeys } from "@/modules/erp/accounting/reports/queries";
import { debitNoteKeys } from "@/modules/erp/debit-notes/queries";
import { purchaseInvoiceKeys } from "@/modules/erp/purchase-invoices/queries";
import { purchaseOrderKeys } from "@/modules/erp/purchase-orders/queries";
import { supplierKeys } from "@/modules/erp/suppliers/queries";
import { supplierPaymentsApi } from "@/modules/erp/supplier-payments/api";
import { supplierPaymentKeys } from "@/modules/erp/supplier-payments/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  posted = false,
) {
  await queryClient.invalidateQueries({ queryKey: supplierPaymentKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: supplierPaymentKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
  await queryClient.invalidateQueries({ queryKey: supplierKeys.all });
  await queryClient.invalidateQueries({ queryKey: debitNoteKeys.all });
  await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
  if (posted) {
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
  await queryClient.invalidateQueries({ queryKey: supplierPaymentKeys.detail(id) });
}

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierPaymentsApi.create,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useUpdateSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof supplierPaymentsApi.update>[1];
      version: number;
    }) => supplierPaymentsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => supplierPaymentsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useAllocateSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      allocations,
    }: WriteVars & { allocations: Parameters<typeof supplierPaymentsApi.allocate>[1]["allocations"] }) =>
      supplierPaymentsApi.allocate(id, { allocations }, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useRefundSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => supplierPaymentsApi.refund(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      supplierPaymentsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => supplierPaymentsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
