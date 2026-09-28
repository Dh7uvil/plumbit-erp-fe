import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { taskLabelsApi } from "@/modules/task-management/task-labels/api";
import type { TaskLabelListParams } from "@/modules/task-management/task-labels/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const taskLabelKeys = {
  all: ["task-labels"] as const,
  list: (params: TaskLabelListParams) => [...taskLabelKeys.all, "list", params] as const,
  allItems: () => [...taskLabelKeys.all, "all-items"] as const,
  detail: (id: string) => [...taskLabelKeys.all, "detail", id] as const,
};

export function useTaskLabels(params: TaskLabelListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(taskLabelKeys.list(params)),
    queryFn: () => taskLabelsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllTaskLabels(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(taskLabelKeys.allItems()),
    queryFn: taskLabelsApi.listAll,
    enabled,
  });
}
