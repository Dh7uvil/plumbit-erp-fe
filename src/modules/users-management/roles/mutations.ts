"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { refetchCurrentUser } from "@/modules/users-management/auth/queries";
import { permissionKeys } from "@/modules/users-management/permissions/queries";
import { rolesApi } from "@/modules/users-management/roles/api";
import { roleKeys } from "@/modules/users-management/roles/queries";

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
  const router = useRouter();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      rolesApi.setPermissions(id, permissionIds),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      await queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      await refetchCurrentUser(queryClient, () => router.refresh());
    },
  });
}

export function useResetRolePermissions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: rolesApi.resetPermissions,
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      await queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      await refetchCurrentUser(queryClient, () => router.refresh());
    },
  });
}
