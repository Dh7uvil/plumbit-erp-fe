import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  LostReasonCreateRequestSchema,
  LostReasonListSchema,
  LostReasonSchema,
  LostReasonUpdateRequestSchema,
  type LostReason,
  type LostReasonCreateRequest,
  type LostReasonListParams,
  type LostReasonUpdateRequest,
} from "@/modules/crm/lost-reasons/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const lostReasonsApi = {
  list: async (params: LostReasonListParams = {}): Promise<ListResponse<LostReason[]>> => {
    const result = await apiClient.getList<unknown>("/lost-reasons", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: LostReasonListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<LostReason[]> =>
    fetchAllPages((page, pageSize) => lostReasonsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<LostReason> =>
    LostReasonSchema.parse(await apiClient.get(`/lost-reasons/${id}`)),
  create: async (values: LostReasonCreateRequest): Promise<LostReason> =>
    LostReasonSchema.parse(
      await apiClient.post("/lost-reasons", LostReasonCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: LostReasonUpdateRequest): Promise<LostReason> =>
    LostReasonSchema.parse(
      await apiClient.patch(`/lost-reasons/${id}`, LostReasonUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<LostReason> =>
    LostReasonSchema.parse(await apiClient.delete(`/lost-reasons/${id}`)),
};
