import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  BranchCreateRequestSchema,
  BranchListSchema,
  BranchSchema,
  BranchUpdateRequestSchema,
  type Branch,
  type BranchCreateRequest,
  type BranchListParams,
  type BranchUpdateRequest,
} from "@/modules/users-management/branches/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const branchesApi = {
  list: async (params: BranchListParams = {}): Promise<ListResponse<Branch[]>> => {
    const result = await apiClient.getList<unknown>("/branches", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        status: params.status,
      },
    });
    return { data: BranchListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Branch[]> =>
    fetchAllPages((page, pageSize) => branchesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Branch> =>
    BranchSchema.parse(await apiClient.get(`/branches/${id}`)),
  create: async (values: BranchCreateRequest): Promise<Branch> =>
    BranchSchema.parse(await apiClient.post("/branches", BranchCreateRequestSchema.parse(values))),
  update: async (id: string, values: BranchUpdateRequest): Promise<Branch> =>
    BranchSchema.parse(
      await apiClient.patch(`/branches/${id}`, BranchUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Branch> =>
    BranchSchema.parse(await apiClient.delete(`/branches/${id}`)),
};
