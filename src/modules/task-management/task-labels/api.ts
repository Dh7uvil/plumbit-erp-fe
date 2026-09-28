import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TaskLabelCreateRequestSchema,
  TaskLabelListSchema,
  TaskLabelSchema,
  TaskLabelUpdateRequestSchema,
  type TaskLabel,
  type TaskLabelCreateRequest,
  type TaskLabelListParams,
  type TaskLabelUpdateRequest,
} from "@/modules/task-management/task-labels/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const taskLabelsApi = {
  list: async (params: TaskLabelListParams = {}): Promise<ListResponse<TaskLabel[]>> => {
    const result = await apiClient.getList<unknown>("/task-labels", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: TaskLabelListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<TaskLabel[]> =>
    fetchAllPages((page, pageSize) =>
      taskLabelsApi.list({ page, page_size: pageSize, is_active: true }),
    ),
  get: async (id: string): Promise<TaskLabel> =>
    TaskLabelSchema.parse(await apiClient.get(`/task-labels/${id}`)),
  create: async (values: TaskLabelCreateRequest): Promise<TaskLabel> =>
    TaskLabelSchema.parse(
      await apiClient.post("/task-labels", TaskLabelCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: TaskLabelUpdateRequest): Promise<TaskLabel> =>
    TaskLabelSchema.parse(
      await apiClient.patch(`/task-labels/${id}`, TaskLabelUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<TaskLabel> =>
    TaskLabelSchema.parse(await apiClient.delete(`/task-labels/${id}`)),
};
