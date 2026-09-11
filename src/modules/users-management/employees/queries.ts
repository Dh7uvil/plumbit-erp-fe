"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { employeesApi } from "@/modules/users-management/employees/api";
import type { EmployeeListParams } from "@/modules/users-management/employees/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.all, "list", params] as const,
  allActive: () => [...employeeKeys.all, "active"] as const,
};

export function useEmployees(params: EmployeeListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(employeeKeys.list(params)),
    queryFn: () => employeesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useActiveEmployees(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(employeeKeys.allActive()),
    queryFn: () => employeesApi.listAll({ status: "ACTIVE" }),
    enabled,
  });
}
