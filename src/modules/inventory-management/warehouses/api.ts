import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  WarehouseCreateRequestSchema,
  WarehouseListSchema,
  WarehouseSchema,
  WarehouseUpdateRequestSchema,
  type Warehouse,
  type WarehouseCreateRequest,
  type WarehouseListParams,
  type WarehouseUpdateRequest,
} from "@/modules/inventory-management/warehouses/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const warehousesApi = {
  list: async (params: WarehouseListParams = {}): Promise<ListResponse<Warehouse[]>> => {
    const result = await apiClient.getList<unknown>("/warehouses", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
        is_default: params.is_default,
      },
    });
    return { data: WarehouseListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Warehouse[]> =>
    fetchAllPages((page, pageSize) => warehousesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Warehouse> =>
    WarehouseSchema.parse(await apiClient.get(`/warehouses/${id}`)),
  create: async (values: WarehouseCreateRequest): Promise<Warehouse> =>
    WarehouseSchema.parse(
      await apiClient.post("/warehouses", WarehouseCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: WarehouseUpdateRequest): Promise<Warehouse> =>
    WarehouseSchema.parse(
      await apiClient.patch(`/warehouses/${id}`, WarehouseUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Warehouse> =>
    WarehouseSchema.parse(await apiClient.delete(`/warehouses/${id}`)),
};
