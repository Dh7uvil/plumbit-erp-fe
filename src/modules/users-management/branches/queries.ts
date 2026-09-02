"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { branchesApi } from "@/modules/users-management/branches/api";
import type { BranchListParams } from "@/modules/users-management/branches/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const branchKeys = {
  all: ["branches"] as const,
  list: (params: BranchListParams) => [...branchKeys.all, "list", params] as const,
  allItems: () => [...branchKeys.all, "all"] as const,
  detail: (id: string) => [...branchKeys.all, "detail", id] as const,
};

export function useBranches(params: BranchListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(branchKeys.list(params)),
    queryFn: () => branchesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllBranches(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(branchKeys.allItems()),
    queryFn: branchesApi.listAll,
    enabled,
  });
}

export function useBranch(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(branchKeys.detail(id ?? "")),
    queryFn: () => branchesApi.get(id!),
    enabled: Boolean(id),
  });
}
