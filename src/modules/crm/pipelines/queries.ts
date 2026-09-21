"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { pipelinesApi } from "@/modules/crm/pipelines/api";
import type { PipelineListParams } from "@/modules/crm/pipelines/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const pipelineKeys = {
  all: ["pipelines"] as const,
  list: (params: PipelineListParams) => [...pipelineKeys.all, "list", params] as const,
  allItems: () => [...pipelineKeys.all, "all"] as const,
  detail: (id: string) => [...pipelineKeys.all, "detail", id] as const,
};

export function usePipelines(params: PipelineListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(pipelineKeys.list(params)),
    queryFn: () => pipelinesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllPipelines(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(pipelineKeys.allItems()),
    queryFn: pipelinesApi.listAll,
    enabled,
  });
}

export function usePipeline(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(pipelineKeys.detail(id ?? "")),
    queryFn: () => pipelinesApi.get(id!),
    enabled: Boolean(id),
  });
}
