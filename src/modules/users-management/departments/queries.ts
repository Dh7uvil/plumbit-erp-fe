"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { departmentsApi } from "@/modules/users-management/departments/api";
import type { DepartmentListParams } from "@/modules/users-management/departments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const departmentKeys = {
  all: ["departments"] as const,
  list: (params: DepartmentListParams) => [...departmentKeys.all, "list", params] as const,
  allItems: (params: Pick<DepartmentListParams, "branch_id"> = {}) =>
    [...departmentKeys.all, "all", params] as const,
  detail: (id: string) => [...departmentKeys.all, "detail", id] as const,
};

export function useDepartments(params: DepartmentListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(departmentKeys.list(params)),
    queryFn: () => departmentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllDepartments(
  params: Pick<DepartmentListParams, "branch_id"> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(departmentKeys.allItems(params)),
    queryFn: () => departmentsApi.listAll(params),
    enabled,
  });
}

export function useDepartment(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(departmentKeys.detail(id ?? "")),
    queryFn: () => departmentsApi.get(id!),
    enabled: Boolean(id),
  });
}
