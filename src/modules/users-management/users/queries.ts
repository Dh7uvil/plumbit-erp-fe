"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { usersApi } from "@/modules/users-management/users/api";
import type { UserListParams } from "@/modules/users-management/users/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const userKeys = {
  all: ["users"] as const,
  list: (params: UserListParams) => [...userKeys.all, "list", params] as const,
  allItems: () => [...userKeys.all, "all"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(userKeys.list(params)),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllUsers(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(userKeys.allItems()),
    queryFn: usersApi.listAll,
    enabled,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(userKeys.detail(id ?? "")),
    queryFn: () => usersApi.get(id!),
    enabled: Boolean(id),
  });
}
