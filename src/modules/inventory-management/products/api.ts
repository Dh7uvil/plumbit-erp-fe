import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TradingHistoryLineListSchema,
  TradingPartyAggregateListSchema,
  type TradingHistoryLine,
  type TradingHistoryListParams,
  type TradingPartyAggregate,
} from "@/modules/inventory-management/history/schemas";
import {
  ProductCreateRequestSchema,
  ProductListSchema,
  ProductSchema,
  ProductUpdateRequestSchema,
  type Product,
  type ProductCreateRequest,
  type ProductListParams,
  type ProductUpdateRequest,
} from "@/modules/inventory-management/products/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const productsApi = {
  list: async (params: ProductListParams = {}): Promise<ListResponse<Product[]>> => {
    const result = await apiClient.getList<unknown>("/products", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        item_type: params.item_type,
        category_id: params.category_id,
        unit_id: params.unit_id,
        tax_id: params.tax_id,
        is_active: params.is_active,
      },
    });
    return { data: ProductListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Product[]> =>
    fetchAllPages((page, pageSize) => productsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Product> =>
    ProductSchema.parse(await apiClient.get(`/products/${id}`)),
  create: async (values: ProductCreateRequest): Promise<Product> =>
    ProductSchema.parse(
      await apiClient.post("/products", ProductCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: ProductUpdateRequest): Promise<Product> =>
    ProductSchema.parse(
      await apiClient.patch(`/products/${id}`, ProductUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Product> =>
    ProductSchema.parse(await apiClient.delete(`/products/${id}`)),
  listCustomers: async (id: string): Promise<ListResponse<TradingPartyAggregate[]>> => {
    const result = await apiClient.getList<unknown>(`/products/${id}/customers`);
    return { data: TradingPartyAggregateListSchema.parse(result.data), meta: result.meta };
  },
  listSalesHistory: async (
    id: string,
    params: TradingHistoryListParams = {},
  ): Promise<ListResponse<TradingHistoryLine[]>> => {
    const result = await apiClient.getList<unknown>(`/products/${id}/sales-history`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        party_id: params.party_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: TradingHistoryLineListSchema.parse(result.data), meta: result.meta };
  },
  listPurchaseHistory: async (
    id: string,
    params: TradingHistoryListParams = {},
  ): Promise<ListResponse<TradingHistoryLine[]>> => {
    const result = await apiClient.getList<unknown>(`/products/${id}/purchase-history`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        party_id: params.party_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: TradingHistoryLineListSchema.parse(result.data), meta: result.meta };
  },
};
