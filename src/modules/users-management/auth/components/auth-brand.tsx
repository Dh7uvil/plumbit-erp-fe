"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { APP_NAME } from "@/config/constants";
import { TenantLogoMark } from "@/modules/users-management/tenants/components/tenant-logo-mark";
import { findOrganizationTenantId } from "@/modules/users-management/tenants/organization";
import { useTenants } from "@/modules/users-management/tenants/queries";
import { useIsClient } from "@/shared/hooks/use-is-client";

const AuthBrandContext = createContext<{
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string) => void;
}>({
  selectedTenantId: null,
  setSelectedTenantId: () => {},
});

export function AuthBrandProvider({ children }: { children: ReactNode }) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const value = useMemo(() => ({ selectedTenantId, setSelectedTenantId }), [selectedTenantId]);
  return <AuthBrandContext.Provider value={value}>{children}</AuthBrandContext.Provider>;
}

export function useAuthBrandSelection() {
  return useContext(AuthBrandContext);
}

export function AuthBrandMark({ compact = false }: { compact?: boolean }) {
  const tenantsQuery = useTenants();
  const isClient = useIsClient();
  const { selectedTenantId } = useAuthBrandSelection();
  const tenants = tenantsQuery.data ?? [];
  const selected =
    tenants.find((tenant) => tenant.tenant_id === selectedTenantId) ??
    tenants.find((tenant) => tenant.tenant_id === findOrganizationTenantId(tenants)) ??
    tenants[0];
  const name = isClient ? (selected?.name ?? APP_NAME) : APP_NAME;
  const logoUrl = isClient ? (selected?.logo_url ?? null) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <TenantLogoMark
          name={name}
          logoUrl={logoUrl}
          className="size-12 rounded-xl"
          fallbackClassName="bg-primary"
          iconClassName="size-6"
          onLogoError={() => {
            void tenantsQuery.refetch();
          }}
        />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold tracking-tight">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
        <TenantLogoMark
          name={name}
          logoUrl={logoUrl}
          className="size-32 rounded-2xl"
          imageClassName="bg-background object-contain p-1"
          fallbackClassName="bg-transparent"
          iconClassName="text-primary-foreground size-16"
          onLogoError={() => {
            void tenantsQuery.refetch();
          }}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
    </>
  );
}
