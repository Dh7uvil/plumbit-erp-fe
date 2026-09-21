"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { opportunitiesApi } from "@/modules/crm/opportunities/api";
import { opportunityKeys } from "@/modules/crm/opportunities/queries";
import { isApiError } from "@/shared/api/errors";

async function invalidateOpportunities(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: opportunitiesApi.create,
    onSuccess: async () => {
      await invalidateOpportunities(queryClient);
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, ...values }: { id: string; version: number }) =>
      opportunitiesApi.update(id, values, version),
    onSuccess: async (_data, variables) => {
      await invalidateOpportunities(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opportunitiesApi.delete(id),
    onSuccess: async () => {
      await invalidateOpportunities(queryClient);
    },
  });
}

export function useChangeOpportunityStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stageId,
      version,
      lostReasonId,
    }: {
      id: string;
      stageId: string;
      version: number;
      lostReasonId?: string | null;
    }) => opportunitiesApi.changeStage(id, stageId, version, lostReasonId),
    onSuccess: async (_data, variables) => {
      await invalidateOpportunities(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useWinOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      opportunitiesApi.win(id, version),
    onSuccess: async (_data, variables) => {
      await invalidateOpportunities(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useLoseOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      lostReasonId,
      version,
    }: {
      id: string;
      lostReasonId: string;
      version: number;
    }) => opportunitiesApi.lose(id, lostReasonId, version),
    onSuccess: async (_data, variables) => {
      await invalidateOpportunities(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useReopenOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      opportunitiesApi.reopen(id, version),
    onSuccess: async (_data, variables) => {
      await invalidateOpportunities(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}
