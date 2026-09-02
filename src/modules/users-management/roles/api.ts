import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import {
  RoleCreateRequestSchema,
  RoleDetailSchema,
  RoleListSchema,
  RoleSchema,
  RoleUpdateRequestSchema,
  SetRolePermissionsRequestSchema,
  type Role,
  type RoleCreateRequest,
  type RoleDetail,
  type RoleListParams,
  type RoleUpdateRequest,
} from "@/modules/users-management/roles/schemas";

export const rolesApi = {
  list: async (params: RoleListParams = {}): Promise<ListResponse<Role[]>> => {
    const result = await apiClient.getList<unknown>("/roles", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
    return { data: RoleListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Role[]> =>
    fetchAllPages((page, pageSize) => rolesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<RoleDetail> =>
    RoleDetailSchema.parse(await apiClient.get(`/roles/${id}`)),
  create: async (values: RoleCreateRequest): Promise<RoleDetail> =>
    RoleDetailSchema.parse(await apiClient.post("/roles", RoleCreateRequestSchema.parse(values))),
  update: async (id: string, values: RoleUpdateRequest): Promise<RoleDetail> =>
    RoleDetailSchema.parse(
      await apiClient.patch(`/roles/${id}`, RoleUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Role> =>
    RoleSchema.parse(await apiClient.delete(`/roles/${id}`)),
  setPermissions: async (id: string, permissionIds: string[]): Promise<RoleDetail> =>
    RoleDetailSchema.parse(
      await apiClient.put(
        `/roles/${id}/permissions`,
        SetRolePermissionsRequestSchema.parse({ permission_ids: permissionIds }),
      ),
    ),
  resetPermissions: async (id: string): Promise<RoleDetail> =>
    RoleDetailSchema.parse(await apiClient.post(`/roles/${id}/permissions/reset`)),
};
