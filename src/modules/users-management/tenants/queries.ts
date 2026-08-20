"use client";

import { useQuery } from "@tanstack/react-query";

import { tenantsApi } from "@/modules/users-management/tenants/api";

export const tenantKeys = {
  all: ["tenants"] as const,
  list: () => [...tenantKeys.all, "list"] as const,
  current: () => [...tenantKeys.all, "current"] as const,
};

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.list(),
    queryFn: tenantsApi.list,
    staleTime: 5 * 60_000,
  });
}

export function useCurrentTenant() {
  return useQuery({
    queryKey: tenantKeys.current(),
    queryFn: tenantsApi.getCurrent,
  });
}
