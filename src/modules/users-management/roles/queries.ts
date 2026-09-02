"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { rolesApi } from "@/modules/users-management/roles/api";
import type { RoleListParams } from "@/modules/users-management/roles/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const roleKeys = {
  all: ["roles"] as const,
  list: (params: RoleListParams) => [...roleKeys.all, "list", params] as const,
  allItems: () => [...roleKeys.all, "all"] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
};

export function useRoles(params: RoleListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(roleKeys.list(params)),
    queryFn: () => rolesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllRoles(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(roleKeys.allItems()),
    queryFn: rolesApi.listAll,
    enabled,
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(roleKeys.detail(id ?? "")),
    queryFn: () => rolesApi.get(id!),
    enabled: Boolean(id),
  });
}
