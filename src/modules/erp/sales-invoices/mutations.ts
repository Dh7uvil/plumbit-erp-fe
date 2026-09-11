"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customerKeys } from "@/modules/crm/customers/queries";
import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { reportKeys } from "@/modules/erp/accounting/reports/queries";
import { creditNoteKeys } from "@/modules/erp/credit-notes/queries";
import { customerPaymentKeys } from "@/modules/erp/customer-payments/queries";
import { salesInvoicesApi } from "@/modules/erp/sales-invoices/api";
import { salesInvoiceKeys } from "@/modules/erp/sales-invoices/queries";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { deliveryNoteKeys } from "@/modules/inventory-management/delivery-notes/queries";
import { isApiError } from "@/shared/api/errors";
import type { PaymentAllocationInput } from "@/shared/components/document/schemas";

type SalesInvoiceWriteVars = { id: string; version: number; creditOverride?: string | null };

async function invalidateSalesInvoices(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  posted = false,
) {
  await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.detail(id) });
  }
  if (posted) {
    await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
    await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
    await queryClient.invalidateQueries({ queryKey: journalKeys.all });
    await queryClient.invalidateQueries({ queryKey: reportKeys.all });
    await queryClient.invalidateQueries({ queryKey: customerKeys.all });
    await queryClient.invalidateQueries({ queryKey: customerPaymentKeys.all });
    await queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.detail(id) });
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesInvoicesApi.create,
    onSuccess: async () => {
      await invalidateSalesInvoices(queryClient);
    },
  });
}

export function useCreateSalesInvoiceFromSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesInvoicesApi.createFromSalesOrder,
    onSuccess: async () => {
      await invalidateSalesInvoices(queryClient);
      await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
    },
  });
}

export function useCreateSalesInvoiceFromDeliveryNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesInvoicesApi.createFromDeliveryNotes,
    onSuccess: async () => {
      await invalidateSalesInvoices(queryClient);
      await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
    },
  });
}

export function useUpdateSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof salesInvoicesApi.update>[1];
      version: number;
    }) => salesInvoicesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesInvoices(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, creditOverride }: SalesInvoiceWriteVars) =>
      salesInvoicesApi.post(id, { version, creditOverride }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesInvoices(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useApplySalesInvoiceCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      allocations,
    }: SalesInvoiceWriteVars & { allocations?: PaymentAllocationInput[] | null }) =>
      salesInvoicesApi.applyCredits(id, { version, allocations }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesInvoices(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: SalesInvoiceWriteVars & { reason?: string | null }) =>
      salesInvoicesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesInvoices(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: SalesInvoiceWriteVars) =>
      salesInvoicesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateSalesInvoices(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
