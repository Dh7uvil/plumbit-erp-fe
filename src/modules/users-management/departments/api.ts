import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  DepartmentCreateRequestSchema,
  DepartmentListSchema,
  DepartmentSchema,
  DepartmentUpdateRequestSchema,
  type Department,
  type DepartmentCreateRequest,
  type DepartmentListParams,
  type DepartmentUpdateRequest,
} from "@/modules/users-management/departments/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const departmentsApi = {
  list: async (params: DepartmentListParams = {}): Promise<ListResponse<Department[]>> => {
    const result = await apiClient.getList<unknown>("/departments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        branch_id: params.branch_id,
      },
    });
    return { data: DepartmentListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<DepartmentListParams, "branch_id"> = {}): Promise<Department[]> =>
    fetchAllPages((page, pageSize) =>
      departmentsApi.list({ page, page_size: pageSize, branch_id: params.branch_id }),
    ),
  get: async (id: string): Promise<Department> =>
    DepartmentSchema.parse(await apiClient.get(`/departments/${id}`)),
  create: async (values: DepartmentCreateRequest): Promise<Department> =>
    DepartmentSchema.parse(
      await apiClient.post("/departments", DepartmentCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: DepartmentUpdateRequest): Promise<Department> =>
    DepartmentSchema.parse(
      await apiClient.patch(`/departments/${id}`, DepartmentUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Department> =>
    DepartmentSchema.parse(await apiClient.delete(`/departments/${id}`)),
};
