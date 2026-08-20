"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { departmentsApi } from "@/modules/users-management/departments/api";
import { departmentKeys } from "@/modules/users-management/departments/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidateDepartments(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: async () => {
      await invalidateDepartments(queryClient);
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof departmentsApi.update>[1];
    }) => departmentsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateDepartments(queryClient);
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: async () => {
      await invalidateDepartments(queryClient);
    },
  });
}
