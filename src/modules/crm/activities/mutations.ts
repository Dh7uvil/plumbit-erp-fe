"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { activitiesApi } from "@/modules/crm/activities/api";
import { activityKeys } from "@/modules/crm/activities/queries";
import type {
  ActivityCompleteRequest,
  ActivityUpdateRequest,
} from "@/modules/crm/activities/schemas";

async function invalidateActivities(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: activityKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: activityKeys.detail(id) });
  }
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: async () => {
      await invalidateActivities(queryClient);
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ActivityUpdateRequest }) =>
      activitiesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateActivities(queryClient, id);
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: async () => {
      await invalidateActivities(queryClient);
    },
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values?: ActivityCompleteRequest }) =>
      activitiesApi.complete(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateActivities(queryClient, id);
    },
  });
}
