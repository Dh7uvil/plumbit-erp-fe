"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pipelinesApi } from "@/modules/crm/pipelines/api";
import { pipelineKeys } from "@/modules/crm/pipelines/queries";

async function invalidatePipelines(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pipelinesApi.create,
    onSuccess: async () => {
      await invalidatePipelines(queryClient);
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof pipelinesApi.update>[1];
    }) => pipelinesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePipelines(queryClient);
      await queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(id) });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pipelinesApi.delete,
    onSuccess: async () => {
      await invalidatePipelines(queryClient);
    },
  });
}

export function useCreatePipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      values,
    }: {
      pipelineId: string;
      values: Parameters<typeof pipelinesApi.createStage>[1];
    }) => pipelinesApi.createStage(pipelineId, values),
    onSuccess: async (_data, { pipelineId }) => {
      await queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
    },
  });
}

export function useDeletePipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, stageId }: { pipelineId: string; stageId: string }) =>
      pipelinesApi.deleteStage(pipelineId, stageId),
    onSuccess: async (_data, { pipelineId }) => {
      await queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
    },
  });
}
