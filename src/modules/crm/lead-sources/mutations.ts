"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { leadSourcesApi } from "@/modules/crm/lead-sources/api";
import { leadSourceKeys } from "@/modules/crm/lead-sources/queries";

async function invalidateLeadSources(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: leadSourceKeys.all });
}

export function useCreateLeadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadSourcesApi.create,
    onSuccess: async () => {
      await invalidateLeadSources(queryClient);
    },
  });
}

export function useUpdateLeadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof leadSourcesApi.update>[1];
    }) => leadSourcesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateLeadSources(queryClient);
      await queryClient.invalidateQueries({ queryKey: leadSourceKeys.detail(id) });
    },
  });
}

export function useDeleteLeadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadSourcesApi.delete,
    onSuccess: async () => {
      await invalidateLeadSources(queryClient);
    },
  });
}
