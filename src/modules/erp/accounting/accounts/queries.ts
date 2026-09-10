"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { accountsApi } from "@/modules/erp/accounting/accounts/api";
import type { AccountListParams } from "@/modules/erp/accounting/accounts/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const accountKeys = {
  all: ["accounts"] as const,
  list: (params: AccountListParams) => [...accountKeys.all, "list", params] as const,
  allItems: (params: AccountListParams = {}) => [...accountKeys.all, "all", params] as const,
  tree: () => [...accountKeys.all, "tree"] as const,
  detail: (id: string) => [...accountKeys.all, "detail", id] as const,
  systemRoles: () => [...accountKeys.all, "system-roles"] as const,
};

export function useAccounts(params: AccountListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(accountKeys.list(params)),
    queryFn: () => accountsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllAccounts(params: AccountListParams = {}, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(accountKeys.allItems(params)),
    queryFn: () => accountsApi.listAll(params),
    enabled,
  });
}

export function useAccountTree(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(accountKeys.tree()),
    queryFn: accountsApi.tree,
    enabled,
  });
}

export function useAccount(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(accountKeys.detail(id ?? "")),
    queryFn: () => accountsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSystemRoleMappings(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(accountKeys.systemRoles()),
    queryFn: accountsApi.systemRoles,
    enabled,
  });
}
