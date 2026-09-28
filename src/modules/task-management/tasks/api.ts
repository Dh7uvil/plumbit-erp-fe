import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TaskAssignRequestSchema,
  TaskChecklistItemSchema,
  TaskCommentSchema,
  TaskCreateRequestSchema,
  TaskListSchema,
  TaskMoveRequestSchema,
  TaskSchema,
  TaskUpdateRequestSchema,
  type Task,
  type TaskAssignRequest,
  type TaskChecklistItem,
  type TaskComment,
  type TaskCreateRequest,
  type TaskListParams,
  type TaskMoveRequest,
  type TaskUpdateRequest,
} from "@/modules/task-management/tasks/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { z } from "zod";

export const tasksApi = {
  list: async (params: TaskListParams = {}): Promise<ListResponse<Task[]>> => {
    const result = await apiClient.getList<unknown>("/tasks", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        statuses: params.statuses?.join(","),
        priority: params.priority,
        priorities: params.priorities?.join(","),
        assignee_id: params.assignee_id,
        assignee_ids: params.assignee_ids?.join(","),
        unassigned: params.unassigned,
        mine: params.mine,
        overdue: params.overdue,
        due_from: params.due_from,
        due_to: params.due_to,
        label_id: params.label_id,
        label_ids: params.label_ids?.join(","),
        task_types: params.task_types?.join(","),
        parent_id: params.parent_id,
        top_level_only: params.top_level_only,
        related_entity_type: params.related_entity_type,
        related_entity_id: params.related_entity_id,
      },
    });
    return { data: TaskListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Task> => TaskSchema.parse(await apiClient.get(`/tasks/${id}`)),
  create: async (values: TaskCreateRequest): Promise<Task> =>
    TaskSchema.parse(await apiClient.post("/tasks", TaskCreateRequestSchema.parse(values))),
  update: async (id: string, values: TaskUpdateRequest): Promise<Task> =>
    TaskSchema.parse(await apiClient.patch(`/tasks/${id}`, TaskUpdateRequestSchema.parse(values))),
  delete: async (id: string): Promise<Task> =>
    TaskSchema.parse(await apiClient.delete(`/tasks/${id}`)),
  move: async (id: string, values: TaskMoveRequest): Promise<Task> =>
    TaskSchema.parse(
      await apiClient.post(`/tasks/${id}/move`, TaskMoveRequestSchema.parse(values)),
    ),
  assign: async (id: string, values: TaskAssignRequest): Promise<Task> =>
    TaskSchema.parse(
      await apiClient.post(`/tasks/${id}/assign`, TaskAssignRequestSchema.parse(values)),
    ),
  setLabels: async (id: string, labelIds: string[]): Promise<Task> =>
    TaskSchema.parse(await apiClient.put(`/tasks/${id}/labels`, { label_ids: labelIds })),
  setWatchers: async (id: string, watcherIds: string[]): Promise<Task> =>
    TaskSchema.parse(await apiClient.put(`/tasks/${id}/watchers`, { watcher_ids: watcherIds })),
  listChecklist: async (taskId: string): Promise<TaskChecklistItem[]> =>
    z.array(TaskChecklistItemSchema).parse(await apiClient.get(`/tasks/${taskId}/checklist-items`)),
  createChecklistItem: async (
    taskId: string,
    values: { title: string; sort_order?: number },
  ): Promise<TaskChecklistItem> =>
    TaskChecklistItemSchema.parse(await apiClient.post(`/tasks/${taskId}/checklist-items`, values)),
  updateChecklistItem: async (
    taskId: string,
    itemId: string,
    values: { title?: string; is_done?: boolean; sort_order?: number },
  ): Promise<TaskChecklistItem> =>
    TaskChecklistItemSchema.parse(
      await apiClient.patch(`/tasks/${taskId}/checklist-items/${itemId}`, values),
    ),
  deleteChecklistItem: async (taskId: string, itemId: string): Promise<TaskChecklistItem> =>
    TaskChecklistItemSchema.parse(
      await apiClient.delete(`/tasks/${taskId}/checklist-items/${itemId}`),
    ),
  listComments: async (taskId: string): Promise<TaskComment[]> =>
    z.array(TaskCommentSchema).parse(await apiClient.get(`/tasks/${taskId}/comments`)),
  createComment: async (taskId: string, body: string): Promise<TaskComment> =>
    TaskCommentSchema.parse(await apiClient.post(`/tasks/${taskId}/comments`, { body })),
  updateComment: async (taskId: string, commentId: string, body: string): Promise<TaskComment> =>
    TaskCommentSchema.parse(
      await apiClient.patch(`/tasks/${taskId}/comments/${commentId}`, { body }),
    ),
  deleteComment: async (taskId: string, commentId: string): Promise<TaskComment> =>
    TaskCommentSchema.parse(await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`)),
};
