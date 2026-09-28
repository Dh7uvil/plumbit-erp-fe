import { useMutation, useQueryClient } from "@tanstack/react-query";

import { taskLabelsApi } from "@/modules/task-management/task-labels/api";
import { taskLabelKeys } from "@/modules/task-management/task-labels/queries";
import type {
  TaskLabelCreateRequest,
  TaskLabelUpdateRequest,
} from "@/modules/task-management/task-labels/schemas";

async function invalidateTaskLabels(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: taskLabelKeys.all });
}

export function useCreateTaskLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaskLabelCreateRequest) => taskLabelsApi.create(values),
    onSuccess: async () => invalidateTaskLabels(queryClient),
  });
}

export function useUpdateTaskLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskLabelUpdateRequest }) =>
      taskLabelsApi.update(id, values),
    onSuccess: async () => invalidateTaskLabels(queryClient),
  });
}

export function useDeleteTaskLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskLabelsApi.delete(id),
    onSuccess: async () => invalidateTaskLabels(queryClient),
  });
}
