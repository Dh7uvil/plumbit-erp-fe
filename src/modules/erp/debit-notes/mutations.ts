"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { debitNotesApi } from "@/modules/erp/debit-notes/api";
import { debitNoteKeys } from "@/modules/erp/debit-notes/queries";
import { purchaseInvoiceKeys } from "@/modules/erp/purchase-invoices/queries";
import { purchaseReturnKeys } from "@/modules/inventory-management/purchase-returns/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string, posted = false) {
  await queryClient.invalidateQueries({ queryKey: debitNoteKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: debitNoteKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
  await queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all });
  if (posted) {
    await queryClient.invalidateQueries({ queryKey: journalKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: debitNoteKeys.detail(id) });
}

export function useCreateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: debitNotesApi.create,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useCreateDebitNoteFromPurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: debitNotesApi.createFromPurchaseInvoice,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useCreateDebitNoteFromPurchaseReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: debitNotesApi.createFromPurchaseReturn,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useUpdateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof debitNotesApi.update>[1];
      version: number;
    }) => debitNotesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => debitNotesApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      debitNotesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => debitNotesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
