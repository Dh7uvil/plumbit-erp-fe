import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  TradingHistoryLineListSchema,
  TradingPartyAggregateListSchema,
  type TradingHistoryLine,
  type TradingHistoryListParams,
  type TradingAggregateListParams,
  type TradingPartyAggregate,
} from "@/modules/inventory-management/history/schemas";
import {
  ProductCreateRequestSchema,
  ProductInquirySchema,
  ProductInventoryListSchema,
  ProductListSchema,
  ProductPurchaseDetailLineListSchema,
  ProductSchema,
  ProductUpdateRequestSchema,
  type Product,
  type ProductInquiry,
  type ProductCreateRequest,
  type InventoryListParams,
  type ProductListParams,
  type ProductPurchaseDetailsParams,
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
  inventoryList: async (params: InventoryListParams = {}) => {
    const result = await apiClient.getList<unknown>("/products/inventory-list", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        category_id: params.category_id,
        brand: params.brand,
        engine: params.engine,
        search_type: params.search_type,
        tracked_only: params.tracked_only,
      },
    });
    return { data: ProductInventoryListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Product> =>
    ProductSchema.parse(await apiClient.get(`/products/${id}`)),
  inquiry: async (id: string): Promise<ProductInquiry> =>
    ProductInquirySchema.parse(await apiClient.get(`/products/${id}/inquiry`)),
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
  renameSku: async (id: string, sku: string): Promise<Product> =>
    ProductSchema.parse(await apiClient.post(`/products/${id}/rename-sku`, { sku })),
  listCustomers: async (
    id: string,
    params: TradingAggregateListParams = {},
  ): Promise<ListResponse<TradingPartyAggregate[]>> => {
    const result = await apiClient.getList<unknown>(`/products/${id}/customers`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
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
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        party_id: params.party_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
        posting_status: params.posting_status,
      },
    });
    return { data: TradingHistoryLineListSchema.parse(result.data), meta: result.meta };
  },
  listPurchaseDetails: async (id: string, params: ProductPurchaseDetailsParams) => {
    const result = await apiClient.getList<unknown>(`/products/${id}/purchase-details`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        kind: params.kind,
        posting_status: params.posting_status,
        name: params.name,
      },
    });
    return { data: ProductPurchaseDetailLineListSchema.parse(result.data), meta: result.meta };
  },
  bulkUpdatePrices: async (
    items: Array<{
      id: string;
      selling_rate?: string;
      price_1?: string;
      price_2?: string;
      purchase_rate?: string;
    }>,
  ): Promise<Product[]> => {
    const result = await apiClient.patch<unknown>("/products/prices", { items });
    return ProductListSchema.parse(result);
  },
  listPurchaseHistory: async (
    id: string,
    params: TradingHistoryListParams = {},
  ): Promise<ListResponse<TradingHistoryLine[]>> => {
    const result = await apiClient.getList<unknown>(`/products/${id}/purchase-history`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        party_id: params.party_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
        posting_status: params.posting_status,
      },
    });
    return { data: TradingHistoryLineListSchema.parse(result.data), meta: result.meta };
  },
};
