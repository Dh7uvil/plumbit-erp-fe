"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { reportKeys } from "@/modules/erp/accounting/reports/queries";
import { customerKeys } from "@/modules/crm/customers/queries";
import { customerPaymentsApi } from "@/modules/erp/customer-payments/api";
import { customerPaymentKeys } from "@/modules/erp/customer-payments/queries";
import { creditNoteKeys } from "@/modules/erp/credit-notes/queries";
import { proformaInvoiceKeys } from "@/modules/erp/proforma-invoices/queries";
import { salesInvoiceKeys } from "@/modules/erp/sales-invoices/queries";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  posted = false,
) {
  await queryClient.invalidateQueries({ queryKey: customerPaymentKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: customerPaymentKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.all });
  await queryClient.invalidateQueries({ queryKey: customerKeys.all });
  await queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
  await queryClient.invalidateQueries({ queryKey: proformaInvoiceKeys.all });
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: customerPaymentKeys.detail(id) });
}

export function useCreateCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerPaymentsApi.create,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useUpdateCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof customerPaymentsApi.update>[1];
      version: number;
    }) => customerPaymentsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => customerPaymentsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useAllocateCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      allocations,
    }: WriteVars & { allocations: Parameters<typeof customerPaymentsApi.allocate>[1]["allocations"] }) =>
      customerPaymentsApi.allocate(id, { allocations }, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useRefundCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => customerPaymentsApi.refund(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      customerPaymentsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => customerPaymentsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
