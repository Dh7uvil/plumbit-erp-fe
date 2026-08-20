import { apiClient } from "@/shared/api/client";
import { TenantListSchema, type TenantPublic } from "@/modules/users-management/tenants/schemas";

export const tenantsApi = {
  list: async (): Promise<TenantPublic[]> =>
    TenantListSchema.parse(await apiClient.get("/tenants")),
};
