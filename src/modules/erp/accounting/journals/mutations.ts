"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "@/modules/erp/accounting/accounts/queries";
import { journalsApi } from "@/modules/erp/accounting/journals/api";
import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateJournals(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: journalKeys.all });
  await queryClient.invalidateQueries({ queryKey: accountKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: journalKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: journalKeys.detail(id) });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalsApi.create,
    onSuccess: async () => {
      await invalidateJournals(queryClient);
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof journalsApi.update>[1];
      version: number;
    }) => journalsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateJournals(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => journalsApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateJournals(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      journalsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateJournals(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useReverseJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      reason,
    }: WriteVars & { reason?: string | null; reversal_date?: string | null }) =>
      journalsApi.reverse(id, { version, reason }),
    onSuccess: async (data) => {
      await invalidateJournals(queryClient, data.id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => journalsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateJournals(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
