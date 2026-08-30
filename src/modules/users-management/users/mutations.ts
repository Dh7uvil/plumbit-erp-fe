"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { refetchCurrentUser } from "@/modules/users-management/auth/queries";
import { branchKeys } from "@/modules/users-management/branches/queries";
import { departmentKeys } from "@/modules/users-management/departments/queries";
import { usersApi } from "@/modules/users-management/users/api";
import { userKeys } from "@/modules/users-management/users/queries";

async function invalidateUserRelated(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: userKeys.all });
  await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
  await queryClient.invalidateQueries({ queryKey: branchKeys.all });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: async () => {
      await invalidateUserRelated(queryClient);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateUserRelated(queryClient);
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.activate,
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      await refetchCurrentUser(queryClient, () => router.refresh());
    },
  });
}
