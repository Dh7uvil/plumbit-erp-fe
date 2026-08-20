import { ORGANIZATION_NAME } from "@/config/constants";
import type { TenantPublic } from "@/modules/users-management/tenants/schemas";

export function findOrganizationTenantId(
  tenants: TenantPublic[],
  organizationName = ORGANIZATION_NAME,
): string | undefined {
  const normalized = organizationName.trim().toLowerCase();
  return tenants.find((tenant) => tenant.name.trim().toLowerCase() === normalized)?.tenant_id;
}
