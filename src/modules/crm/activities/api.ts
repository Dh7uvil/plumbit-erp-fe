import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ActivityCompleteRequestSchema,
  ActivityCreateRequestSchema,
  ActivityListSchema,
  ActivitySchema,
  ActivityUpdateRequestSchema,
  type Activity,
  type ActivityCompleteRequest,
  type ActivityCreateRequest,
  type ActivityListParams,
  type ActivityUpdateRequest,
} from "@/modules/crm/activities/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const activitiesApi = {
  list: async (params: ActivityListParams = {}): Promise<ListResponse<Activity[]>> => {
    const result = await apiClient.getList<unknown>("/activities", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        related_entity_type: params.related_entity_type,
        related_entity_id: params.related_entity_id,
        owner_id: params.owner_id,
        status: params.status,
        activity_type: params.activity_type,
        overdue: params.overdue,
        mine: params.mine,
        due_from: params.due_from,
        due_to: params.due_to,
      },
    });
    return { data: ActivityListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Activity> =>
    ActivitySchema.parse(await apiClient.get(`/activities/${id}`)),
  create: async (values: ActivityCreateRequest): Promise<Activity> =>
    ActivitySchema.parse(
      await apiClient.post("/activities", ActivityCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: ActivityUpdateRequest): Promise<Activity> =>
    ActivitySchema.parse(
      await apiClient.patch(`/activities/${id}`, ActivityUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Activity> =>
    ActivitySchema.parse(await apiClient.delete(`/activities/${id}`)),
  complete: async (id: string, values: ActivityCompleteRequest = {}): Promise<Activity> =>
    ActivitySchema.parse(
      await apiClient.post(
        `/activities/${id}/complete`,
        ActivityCompleteRequestSchema.parse(values),
      ),
    ),
};
