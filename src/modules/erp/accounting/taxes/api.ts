import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TaxCreateRequestSchema,
  TaxListSchema,
  TaxSchema,
  TaxUpdateRequestSchema,
  type Tax,
  type TaxCreateRequest,
  type TaxListParams,
  type TaxUpdateRequest,
} from "@/modules/erp/accounting/taxes/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const taxesApi = {
  list: async (params: TaxListParams = {}): Promise<ListResponse<Tax[]>> => {
    const result = await apiClient.getList<unknown>("/taxes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: TaxListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Tax[]> =>
    fetchAllPages((page, pageSize) => taxesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Tax> => TaxSchema.parse(await apiClient.get(`/taxes/${id}`)),
  create: async (values: TaxCreateRequest): Promise<Tax> =>
    TaxSchema.parse(await apiClient.post("/taxes", TaxCreateRequestSchema.parse(values))),
  update: async (id: string, values: TaxUpdateRequest): Promise<Tax> =>
    TaxSchema.parse(await apiClient.patch(`/taxes/${id}`, TaxUpdateRequestSchema.parse(values))),
  delete: async (id: string): Promise<Tax> =>
    TaxSchema.parse(await apiClient.delete(`/taxes/${id}`)),
};
