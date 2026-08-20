"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { branchesApi } from "@/modules/users-management/branches/api";
import { branchKeys } from "@/modules/users-management/branches/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidateBranches(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: branchKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.create,
    onSuccess: async () => {
      await invalidateBranches(queryClient);
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof branchesApi.update>[1];
    }) => branchesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateBranches(queryClient);
      await queryClient.invalidateQueries({ queryKey: branchKeys.detail(id) });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesApi.delete,
    onSuccess: async () => {
      await invalidateBranches(queryClient);
    },
  });
}
