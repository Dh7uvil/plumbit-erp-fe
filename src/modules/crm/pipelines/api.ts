import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PipelineCreateRequestSchema,
  PipelineListSchema,
  PipelineSchema,
  PipelineStageCreateRequestSchema,
  PipelineStageSchema,
  PipelineStageUpdateRequestSchema,
  PipelineUpdateRequestSchema,
  type Pipeline,
  type PipelineCreateRequest,
  type PipelineListItem,
  type PipelineListParams,
  type PipelineStage,
  type PipelineStageCreateRequest,
  type PipelineStageUpdateRequest,
  type PipelineUpdateRequest,
} from "@/modules/crm/pipelines/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const pipelinesApi = {
  list: async (params: PipelineListParams = {}): Promise<ListResponse<PipelineListItem[]>> => {
    const result = await apiClient.getList<unknown>("/pipelines", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
        is_default: params.is_default,
      },
    });
    return { data: PipelineListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<PipelineListItem[]> =>
    fetchAllPages((page, pageSize) => pipelinesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Pipeline> =>
    PipelineSchema.parse(await apiClient.get(`/pipelines/${id}`)),
  create: async (values: PipelineCreateRequest): Promise<Pipeline> =>
    PipelineSchema.parse(
      await apiClient.post("/pipelines", PipelineCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: PipelineUpdateRequest): Promise<Pipeline> =>
    PipelineSchema.parse(
      await apiClient.patch(`/pipelines/${id}`, PipelineUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Pipeline> =>
    PipelineSchema.parse(await apiClient.delete(`/pipelines/${id}`)),
  createStage: async (
    pipelineId: string,
    values: PipelineStageCreateRequest,
  ): Promise<PipelineStage> =>
    PipelineStageSchema.parse(
      await apiClient.post(
        `/pipelines/${pipelineId}/stages`,
        PipelineStageCreateRequestSchema.parse(values),
      ),
    ),
  updateStage: async (
    pipelineId: string,
    stageId: string,
    values: PipelineStageUpdateRequest,
  ): Promise<PipelineStage> =>
    PipelineStageSchema.parse(
      await apiClient.patch(
        `/pipelines/${pipelineId}/stages/${stageId}`,
        PipelineStageUpdateRequestSchema.parse(values),
      ),
    ),
  deleteStage: async (pipelineId: string, stageId: string): Promise<PipelineStage> =>
    PipelineStageSchema.parse(await apiClient.delete(`/pipelines/${pipelineId}/stages/${stageId}`)),
};
