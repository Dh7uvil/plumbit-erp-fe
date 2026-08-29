import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CurrencyCreateRequestSchema,
  CurrencyListSchema,
  CurrencySchema,
  CurrencyUpdateRequestSchema,
  type Currency,
  type CurrencyCreateRequest,
  type CurrencyListParams,
  type CurrencyUpdateRequest,
} from "@/modules/erp/currencies/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const currenciesApi = {
  list: async (params: CurrencyListParams = {}): Promise<ListResponse<Currency[]>> => {
    const result = await apiClient.getList<unknown>("/currencies", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_base: params.is_base,
        is_active: params.is_active,
      },
    });
    return { data: CurrencyListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Currency[]> =>
    fetchAllPages((page, pageSize) => currenciesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Currency> =>
    CurrencySchema.parse(await apiClient.get(`/currencies/${id}`)),
  create: async (values: CurrencyCreateRequest): Promise<Currency> =>
    CurrencySchema.parse(
      await apiClient.post("/currencies", CurrencyCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: CurrencyUpdateRequest): Promise<Currency> =>
    CurrencySchema.parse(
      await apiClient.patch(`/currencies/${id}`, CurrencyUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Currency> =>
    CurrencySchema.parse(await apiClient.delete(`/currencies/${id}`)),
};
