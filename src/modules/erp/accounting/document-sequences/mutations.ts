"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { documentSequencesApi } from "@/modules/erp/accounting/document-sequences/api";
import { documentSequenceKeys } from "@/modules/erp/accounting/document-sequences/queries";

async function invalidateDocumentSequences(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: documentSequenceKeys.all });
}

export function useCreateDocumentSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentSequencesApi.create,
    onSuccess: async () => {
      await invalidateDocumentSequences(queryClient);
    },
  });
}

export function useUpdateDocumentSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof documentSequencesApi.update>[1];
    }) => documentSequencesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateDocumentSequences(queryClient);
      await queryClient.invalidateQueries({ queryKey: documentSequenceKeys.detail(id) });
    },
  });
}

export function useDeleteDocumentSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentSequencesApi.delete,
    onSuccess: async () => {
      await invalidateDocumentSequences(queryClient);
    },
  });
}
