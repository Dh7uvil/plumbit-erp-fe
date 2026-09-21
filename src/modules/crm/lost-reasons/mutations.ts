"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { lostReasonsApi } from "@/modules/crm/lost-reasons/api";
import { lostReasonKeys } from "@/modules/crm/lost-reasons/queries";

async function invalidateLostReasons(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: lostReasonKeys.all });
}

export function useCreateLostReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lostReasonsApi.create,
    onSuccess: async () => {
      await invalidateLostReasons(queryClient);
    },
  });
}

export function useUpdateLostReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof lostReasonsApi.update>[1];
    }) => lostReasonsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateLostReasons(queryClient);
      await queryClient.invalidateQueries({ queryKey: lostReasonKeys.detail(id) });
    },
  });
}

export function useDeleteLostReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lostReasonsApi.delete,
    onSuccess: async () => {
      await invalidateLostReasons(queryClient);
    },
  });
}
