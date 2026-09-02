"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { quotationsApi } from "@/modules/erp/quotations/api";
import { quotationKeys } from "@/modules/erp/quotations/queries";
import { isApiError } from "@/shared/api/errors";

type QuotationWriteVars = { id: string; version: number };

async function invalidateQuotations(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.create,
    onSuccess: async () => {
      await invalidateQuotations(queryClient);
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof quotationsApi.update>[1];
      version: number;
    }) => quotationsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateQuotations(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

function useQuotationVersionMutation(
  mutationFn: (id: string, options: { version: number }) => ReturnType<typeof quotationsApi.submit>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: QuotationWriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateQuotations(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useSubmitQuotation() {
  return useQuotationVersionMutation(quotationsApi.submit);
}

export function useApproveQuotation() {
  return useQuotationVersionMutation(quotationsApi.approve);
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: QuotationWriteVars & { reason?: string | null }) =>
      quotationsApi.reject(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateQuotations(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useReopenQuotation() {
  return useQuotationVersionMutation(quotationsApi.reopen);
}

export function useSendQuotation() {
  return useQuotationVersionMutation(quotationsApi.send);
}

export function useAcceptQuotation() {
  return useQuotationVersionMutation(quotationsApi.accept);
}

export function useDeclineQuotation() {
  return useQuotationVersionMutation(quotationsApi.decline);
}

export function useCancelQuotation() {
  return useQuotationVersionMutation(quotationsApi.cancel);
}

export function useCloneQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.clone,
    onSuccess: async () => {
      await invalidateQuotations(queryClient);
    },
  });
}

export function useDeleteQuotation() {
  return useQuotationVersionMutation(quotationsApi.delete);
}
