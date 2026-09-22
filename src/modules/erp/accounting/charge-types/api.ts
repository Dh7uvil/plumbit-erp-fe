import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

import {
  ChargeTypeListSchema,
  ChargeTypeSchema,
  ChargeTypeUpdateRequestSchema,
  type ChargeType,
  type ChargeTypeListParams,
  type ChargeTypeUpdateRequest,
} from "./schemas";

export const chargeTypesApi = {
  list: async (params: ChargeTypeListParams = {}): Promise<ListResponse<ChargeType[]>> => {
    const result = await apiClient.getList<unknown>("/charge-types", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: ChargeTypeListSchema.parse(result.data), meta: result.meta };
  },
  listAllActive: (): Promise<ChargeType[]> =>
    fetchAllPages((page, pageSize) =>
      chargeTypesApi.list({ page, page_size: pageSize, is_active: true, sort_by: "sort_order" }),
    ),
  update: async (id: string, values: ChargeTypeUpdateRequest): Promise<ChargeType> =>
    ChargeTypeSchema.parse(
      await apiClient.patch(`/charge-types/${id}`, ChargeTypeUpdateRequestSchema.parse(values)),
    ),
};
