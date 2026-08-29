"use client";

import { APP_NAME } from "@/config/constants";
import { useMe } from "@/modules/users-management/auth/queries";
import { TenantLogoMark } from "@/modules/users-management/tenants/components/tenant-logo-mark";
import { findOrganizationTenantId } from "@/modules/users-management/tenants/organization";
import { useCurrentTenant, useTenants } from "@/modules/users-management/tenants/queries";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { cn } from "@/shared/lib/cn";

export function TenantSidebarBrand({ collapsed }: { collapsed: boolean }) {
  const tenantQuery = useCurrentTenant();
  const tenantsQuery = useTenants();
  const meQuery = useMe();
  const isClient = useIsClient();
  const tenants = tenantsQuery.data ?? [];
  const publicTenant =
    tenants.find((tenant) => tenant.tenant_id === meQuery.data?.tenant_id) ??
    tenants.find((tenant) => tenant.tenant_id === findOrganizationTenantId(tenants)) ??
    tenants[0];
  const name = tenantQuery.data?.name ?? publicTenant?.name ?? APP_NAME;
  const logoUrl = tenantQuery.data?.logo_url ?? publicTenant?.logo_url ?? null;

  function refetchLogo() {
    void tenantQuery.refetch();
    void tenantsQuery.refetch();
  }

  return (
    <div
      className={cn(
        "flex items-center",
        collapsed ? "shrink-0 justify-center" : "min-w-0 gap-2.5",
      )}
    >
      <TenantLogoMark
        name={name}
        logoUrl={isClient ? logoUrl : null}
        alt={name}
        className={cn("rounded-lg", collapsed ? "size-8" : "size-7")}
        imageClassName="bg-background object-contain"
        iconClassName={collapsed ? "size-4" : "size-3.5"}
        onLogoError={refetchLogo}
      />
      {!collapsed ? (
        <span className="text-foreground truncate text-sm font-semibold tracking-tight">
          {isClient ? name : APP_NAME}
        </span>
      ) : null}
    </div>
  );
}
