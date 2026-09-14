import { ORGANIZATION_NAME } from "@/config/constants";
import { readLastTenantId } from "@/modules/users-management/tenants/last-tenant";
import type { TenantPublic } from "@/modules/users-management/tenants/schemas";

export function findOrganizationTenantId(
  tenants: TenantPublic[],
  organizationName = ORGANIZATION_NAME,
): string | undefined {
  const lastTenantId = readLastTenantId();
  if (lastTenantId && tenants.some((tenant) => tenant.tenant_id === lastTenantId)) {
    return lastTenantId;
  }
  const normalized = organizationName.trim().toLowerCase();
  return tenants.find((tenant) => tenant.name.trim().toLowerCase() === normalized)?.tenant_id;
}
