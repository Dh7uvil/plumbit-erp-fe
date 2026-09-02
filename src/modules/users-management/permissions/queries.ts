"use client";

import { useQuery } from "@tanstack/react-query";

import { permissionsApi } from "@/modules/users-management/permissions/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const permissionKeys = {
  all: ["permissions"] as const,
  matrix: (roleId: string | null) => [...permissionKeys.all, "matrix", roleId] as const,
};

export function usePermissionMatrix(roleId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(permissionKeys.matrix(roleId)),
    queryFn: () => permissionsApi.matrix(roleId),
    enabled: Boolean(roleId),
  });
}
