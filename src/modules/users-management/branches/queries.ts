"use client";

import { useQuery } from "@tanstack/react-query";

import { branchesApi } from "@/modules/users-management/branches/api";
import type { BranchListParams } from "@/modules/users-management/branches/schemas";

export const branchKeys = {
  all: ["branches"] as const,
  list: (params: BranchListParams) => [...branchKeys.all, "list", params] as const,
  allItems: () => [...branchKeys.all, "all"] as const,
  detail: (id: string) => [...branchKeys.all, "detail", id] as const,
};

export function useBranches(params: BranchListParams) {
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: () => branchesApi.list(params),
  });
}

export function useAllBranches(enabled = true) {
  return useQuery({
    queryKey: branchKeys.allItems(),
    queryFn: branchesApi.listAll,
    enabled,
  });
}

export function useBranch(id: string | null) {
  return useQuery({
    queryKey: branchKeys.detail(id ?? ""),
    queryFn: () => branchesApi.get(id!),
    enabled: Boolean(id),
  });
}
