"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { creditNotesApi } from "@/modules/erp/credit-notes/api";
import { creditNoteKeys } from "@/modules/erp/credit-notes/queries";
import { salesInvoiceKeys } from "@/modules/erp/sales-invoices/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string, posted = false) {
  await queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: creditNoteKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: creditNoteKeys.detail(id) });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creditNotesApi.create,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useCreateCreditNoteFromSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creditNotesApi.createFromSalesInvoice,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useCreateCreditNoteFromSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creditNotesApi.createFromSalesReturn,
    onSuccess: async () => {
      await invalidate(queryClient);
    },
  });
}

export function useUpdateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof creditNotesApi.update>[1];
      version: number;
    }) => creditNotesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => creditNotesApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      creditNotesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => creditNotesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidate(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
