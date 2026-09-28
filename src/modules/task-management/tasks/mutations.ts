import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/modules/task-management/tasks/api";
import { taskKeys } from "@/modules/task-management/tasks/queries";
import type {
  TaskAssignRequest,
  TaskCreateRequest,
  TaskMoveRequest,
  TaskUpdateRequest,
} from "@/modules/task-management/tasks/schemas";

async function invalidateTasks(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: taskKeys.all });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaskCreateRequest) => tasksApi.create(values),
    onSuccess: async () => invalidateTasks(queryClient),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskUpdateRequest }) =>
      tasksApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateTasks(queryClient);
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: async () => invalidateTasks(queryClient),
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskMoveRequest }) =>
      tasksApi.move(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateTasks(queryClient);
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskAssignRequest }) =>
      tasksApi.assign(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateTasks(queryClient);
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useSetTaskLabels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, labelIds }: { id: string; labelIds: string[] }) =>
      tasksApi.setLabels(id, labelIds),
    onSuccess: async (_data, { id }) => {
      await invalidateTasks(queryClient);
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useSetTaskWatchers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, watcherIds }: { id: string; watcherIds: string[] }) =>
      tasksApi.setWatchers(id, watcherIds),
    onSuccess: async (_data, { id }) => {
      await invalidateTasks(queryClient);
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      values,
    }: {
      taskId: string;
      values: { title: string; sort_order?: number };
    }) => tasksApi.createChecklistItem(taskId, values),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      itemId,
      values,
    }: {
      taskId: string;
      itemId: string;
      values: { title?: string; is_done?: boolean; sort_order?: number };
    }) => tasksApi.updateChecklistItem(taskId, itemId, values),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      tasksApi.deleteChecklistItem(taskId, itemId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useCreateTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) =>
      tasksApi.createComment(taskId, body),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
    },
  });
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      tasksApi.deleteComment(taskId, commentId),
    onSuccess: async (_data, { taskId }) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
    },
  });
}
