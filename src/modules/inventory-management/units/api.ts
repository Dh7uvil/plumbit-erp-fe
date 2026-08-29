import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  UnitCreateRequestSchema,
  UnitListSchema,
  UnitSchema,
  UnitUpdateRequestSchema,
  type Unit,
  type UnitCreateRequest,
  type UnitListParams,
  type UnitUpdateRequest,
} from "@/modules/inventory-management/units/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const unitsApi = {
  list: async (params: UnitListParams = {}): Promise<ListResponse<Unit[]>> => {
    const result = await apiClient.getList<unknown>("/units", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: UnitListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Unit[]> =>
    fetchAllPages((page, pageSize) => unitsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Unit> => UnitSchema.parse(await apiClient.get(`/units/${id}`)),
  create: async (values: UnitCreateRequest): Promise<Unit> =>
    UnitSchema.parse(await apiClient.post("/units", UnitCreateRequestSchema.parse(values))),
  update: async (id: string, values: UnitUpdateRequest): Promise<Unit> =>
    UnitSchema.parse(await apiClient.patch(`/units/${id}`, UnitUpdateRequestSchema.parse(values))),
  delete: async (id: string): Promise<Unit> =>
    UnitSchema.parse(await apiClient.delete(`/units/${id}`)),
};
