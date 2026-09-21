import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  LeadSourceCreateRequestSchema,
  LeadSourceListSchema,
  LeadSourceSchema,
  LeadSourceUpdateRequestSchema,
  type LeadSource,
  type LeadSourceCreateRequest,
  type LeadSourceListParams,
  type LeadSourceUpdateRequest,
} from "@/modules/crm/lead-sources/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const leadSourcesApi = {
  list: async (params: LeadSourceListParams = {}): Promise<ListResponse<LeadSource[]>> => {
    const result = await apiClient.getList<unknown>("/lead-sources", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: LeadSourceListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<LeadSource[]> =>
    fetchAllPages((page, pageSize) => leadSourcesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<LeadSource> =>
    LeadSourceSchema.parse(await apiClient.get(`/lead-sources/${id}`)),
  create: async (values: LeadSourceCreateRequest): Promise<LeadSource> =>
    LeadSourceSchema.parse(
      await apiClient.post("/lead-sources", LeadSourceCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: LeadSourceUpdateRequest): Promise<LeadSource> =>
    LeadSourceSchema.parse(
      await apiClient.patch(`/lead-sources/${id}`, LeadSourceUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<LeadSource> =>
    LeadSourceSchema.parse(await apiClient.delete(`/lead-sources/${id}`)),
};
