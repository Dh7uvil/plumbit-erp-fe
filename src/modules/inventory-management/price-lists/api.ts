import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PriceListCreateRequestSchema,
  PriceListItemSchema,
  PriceListItemUpsertRequestSchema,
  PriceListListSchema,
  PriceListSchema,
  PriceListUpdateRequestSchema,
  type PriceList,
  type PriceListCreateRequest,
  type PriceListItem,
  type PriceListItemUpsertRequest,
  type PriceListListParams,
  type PriceListUpdateRequest,
} from "@/modules/inventory-management/price-lists/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const priceListsApi = {
  list: async (params: PriceListListParams = {}): Promise<ListResponse<PriceList[]>> => {
    const result = await apiClient.getList<unknown>("/price-lists", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        currency_id: params.currency_id,
        list_type: params.list_type,
        is_active: params.is_active,
      },
    });
    return { data: PriceListListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<PriceList[]> =>
    fetchAllPages((page, pageSize) => priceListsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<PriceList> =>
    PriceListSchema.parse(await apiClient.get(`/price-lists/${id}`)),
  create: async (values: PriceListCreateRequest): Promise<PriceList> =>
    PriceListSchema.parse(
      await apiClient.post("/price-lists", PriceListCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: PriceListUpdateRequest): Promise<PriceList> =>
    PriceListSchema.parse(
      await apiClient.patch(`/price-lists/${id}`, PriceListUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<PriceList> =>
    PriceListSchema.parse(await apiClient.delete(`/price-lists/${id}`)),
  upsertItem: async (id: string, values: PriceListItemUpsertRequest): Promise<PriceListItem> =>
    PriceListItemSchema.parse(
      await apiClient.put(
        `/price-lists/${id}/items`,
        PriceListItemUpsertRequestSchema.parse(values),
      ),
    ),
  deleteItem: async (id: string, productId: string): Promise<PriceListItem> =>
    PriceListItemSchema.parse(await apiClient.delete(`/price-lists/${id}/items/${productId}`)),
};
