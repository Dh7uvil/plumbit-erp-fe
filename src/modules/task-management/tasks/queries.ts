import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { tasksApi } from "@/modules/task-management/tasks/api";
import type { TaskListParams } from "@/modules/task-management/tasks/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams) => [...taskKeys.all, "list", params] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  comments: (id: string) => [...taskKeys.all, "comments", id] as const,
};

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(taskKeys.list(params)),
    queryFn: () => tasksApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(taskKeys.detail(id ?? "")),
    queryFn: () => tasksApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(taskKeys.comments(taskId ?? "")),
    queryFn: () => tasksApi.listComments(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useOverdueTasksCount(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey([...taskKeys.all, "overdue-count"]),
    queryFn: async () => {
      const result = await tasksApi.list({ mine: true, overdue: true, page: 1, page_size: 1 });
      return result.meta.total;
    },
    enabled,
    staleTime: 60_000,
  });
}
