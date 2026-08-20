import { apiClient } from "@/shared/api/client";
import {
  TenantCurrentSchema,
  TenantCurrentUpdateSchema,
  TenantListSchema,
  type TenantCurrent,
  type TenantCurrentUpdate,
  type TenantPublic,
} from "@/modules/users-management/tenants/schemas";

export const tenantsApi = {
  list: async (): Promise<TenantPublic[]> =>
    TenantListSchema.parse(await apiClient.get("/tenants")),
  getCurrent: async (): Promise<TenantCurrent> =>
    TenantCurrentSchema.parse(await apiClient.get("/tenants/current")),
  updateCurrent: async (values: TenantCurrentUpdate): Promise<TenantCurrent> =>
    TenantCurrentSchema.parse(
      await apiClient.patch("/tenants/current", TenantCurrentUpdateSchema.parse(values)),
    ),
};
