"use client";

import { useQuery } from "@tanstack/react-query";

import { rolesApi } from "@/modules/users-management/roles/api";
import type { RoleListParams } from "@/modules/users-management/roles/schemas";

export const roleKeys = {
  all: ["roles"] as const,
  list: (params: RoleListParams) => [...roleKeys.all, "list", params] as const,
  allItems: () => [...roleKeys.all, "all"] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
};

export function useRoles(params: RoleListParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => rolesApi.list(params),
  });
}

export function useAllRoles(enabled = true) {
  return useQuery({
    queryKey: roleKeys.allItems(),
    queryFn: rolesApi.listAll,
    enabled,
  });
}

export function useRole(id: string | null) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? ""),
    queryFn: () => rolesApi.get(id!),
    enabled: Boolean(id),
  });
}
