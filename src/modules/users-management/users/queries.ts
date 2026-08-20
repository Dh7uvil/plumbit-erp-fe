"use client";

import { useQuery } from "@tanstack/react-query";

import { usersApi } from "@/modules/users-management/users/api";
import type { UserListParams } from "@/modules/users-management/users/schemas";

export const userKeys = {
  all: ["users"] as const,
  list: (params: UserListParams) => [...userKeys.all, "list", params] as const,
  allItems: () => [...userKeys.all, "all"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useAllUsers(enabled = true) {
  return useQuery({
    queryKey: userKeys.allItems(),
    queryFn: usersApi.listAll,
    enabled,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => usersApi.get(id!),
    enabled: Boolean(id),
  });
}
