import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CategoryCreateRequestSchema,
  CategoryListSchema,
  CategorySchema,
  CategoryUpdateRequestSchema,
  type Category,
  type CategoryCreateRequest,
  type CategoryListParams,
  type CategoryUpdateRequest,
} from "@/modules/inventory-management/categories/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const categoriesApi = {
  list: async (params: CategoryListParams = {}): Promise<ListResponse<Category[]>> => {
    const result = await apiClient.getList<unknown>("/categories", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        parent_id: params.parent_id,
        is_active: params.is_active,
      },
    });
    return { data: CategoryListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Category[]> =>
    fetchAllPages((page, pageSize) => categoriesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Category> =>
    CategorySchema.parse(await apiClient.get(`/categories/${id}`)),
  create: async (values: CategoryCreateRequest): Promise<Category> =>
    CategorySchema.parse(
      await apiClient.post("/categories", CategoryCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: CategoryUpdateRequest): Promise<Category> =>
    CategorySchema.parse(
      await apiClient.patch(`/categories/${id}`, CategoryUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Category> =>
    CategorySchema.parse(await apiClient.delete(`/categories/${id}`)),
};
