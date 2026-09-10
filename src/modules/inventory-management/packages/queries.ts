"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { packagesApi } from "@/modules/inventory-management/packages/api";
import type { PackageListParams } from "@/modules/inventory-management/packages/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const packageKeys = {
  all: ["packages"] as const,
  list: (params: PackageListParams) => [...packageKeys.all, "list", params] as const,
  detail: (id: string) => [...packageKeys.all, "detail", id] as const,
};

export function usePackages(params: PackageListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(packageKeys.list(params)),
    queryFn: () => packagesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePackage(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(packageKeys.detail(id ?? "")),
    queryFn: () => packagesApi.get(id!),
    enabled: Boolean(id),
  });
}
