import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CostCenterCreateRequestSchema,
  CostCenterListSchema,
  CostCenterSchema,
  CostCenterUpdateRequestSchema,
  type CostCenter,
  type CostCenterCreateRequest,
  type CostCenterListParams,
  type CostCenterUpdateRequest,
} from "@/modules/erp/accounting/cost-centers/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const costCentersApi = {
  list: async (params: CostCenterListParams = {}): Promise<ListResponse<CostCenter[]>> => {
    const result = await apiClient.getList<unknown>("/cost-centers", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: CostCenterListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<CostCenter[]> =>
    fetchAllPages((page, pageSize) => costCentersApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<CostCenter> =>
    CostCenterSchema.parse(await apiClient.get(`/cost-centers/${id}`)),
  create: async (values: CostCenterCreateRequest): Promise<CostCenter> =>
    CostCenterSchema.parse(
      await apiClient.post("/cost-centers", CostCenterCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: CostCenterUpdateRequest): Promise<CostCenter> =>
    CostCenterSchema.parse(
      await apiClient.patch(`/cost-centers/${id}`, CostCenterUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<CostCenter> =>
    CostCenterSchema.parse(await apiClient.delete(`/cost-centers/${id}`)),
};
