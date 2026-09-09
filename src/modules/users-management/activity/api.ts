import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ActivityListSchema,
  type ActivityEntry,
  type ActivityListParams,
} from "@/modules/users-management/activity/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const activityApi = {
  list: async (params: ActivityListParams): Promise<ListResponse<ActivityEntry[]>> => {
    const result = await apiClient.getList<unknown>("/activity", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        date_from: params.date_from,
        date_to: params.date_to,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
      },
    });
    return { data: ActivityListSchema.parse(result.data), meta: result.meta };
  },
};
