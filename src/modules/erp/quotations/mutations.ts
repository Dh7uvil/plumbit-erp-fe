"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { quotationsApi } from "@/modules/erp/quotations/api";
import { quotationKeys } from "@/modules/erp/quotations/queries";

async function invalidateQuotations(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
  }
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
    }: {
      id: string;
      values: Parameters<typeof quotationsApi.update>[1];
    }) => quotationsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useSubmitQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.submit,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.approve,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.reject,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useReopenQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.reopen,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.send,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useAcceptQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.accept,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useDeclineQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.decline,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
}

export function useCancelQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.cancel,
    onSuccess: async (_data, id) => {
      await invalidateQuotations(queryClient, id);
    },
  });
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
