"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { refetchCurrentUser } from "@/modules/users-management/auth/queries";
import {
  applyGrantedIds,
  isPermissionMatrix,
} from "@/modules/users-management/permissions/matrix";
import { permissionKeys } from "@/modules/users-management/permissions/queries";
import { rolesApi } from "@/modules/users-management/roles/api";
import { roleKeys } from "@/modules/users-management/roles/queries";
import type { RoleDetail } from "@/modules/users-management/roles/schemas";

async function syncRolePermissionQueries(
  queryClient: QueryClient,
  id: string,
  detail: RoleDetail,
  permissionIds: string[],
) {
  const grantedIds = new Set(
    detail.permissions.length > 0 ? detail.permissions.map((item) => item.id) : permissionIds,
  );
  queryClient.setQueriesData({ queryKey: permissionKeys.all }, (current) => {
    if (!isPermissionMatrix(current)) {
      return current;
    }
    return applyGrantedIds(current, grantedIds);
  });
  await queryClient.invalidateQueries({ queryKey: roleKeys.all });
  await queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
  await queryClient.refetchQueries({ queryKey: permissionKeys.all });
  await refetchCurrentUser(queryClient);
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof rolesApi.update>[1] }) =>
      rolesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      await queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      await refetchCurrentUser(queryClient, () => router.refresh());
    },
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      rolesApi.setPermissions(id, permissionIds),
    onSuccess: async (detail, { id, permissionIds }) => {
      await syncRolePermissionQueries(queryClient, id, detail, permissionIds);
    },
  });
}

export function useResetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.resetPermissions,
    onSuccess: async (detail, id) => {
      await syncRolePermissionQueries(
        queryClient,
        id,
        detail,
        detail.permissions.map((item) => item.id),
      );
    },
  });
}
