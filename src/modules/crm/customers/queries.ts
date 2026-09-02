"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { customersApi } from "@/modules/crm/customers/api";
import type { CustomerListParams } from "@/modules/crm/customers/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomerListParams) => [...customerKeys.all, "list", params] as const,
  allItems: () => [...customerKeys.all, "all"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(customerKeys.list(params)),
    queryFn: () => customersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllCustomers(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(customerKeys.allItems()),
    queryFn: customersApi.listAll,
    enabled,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(customerKeys.detail(id ?? "")),
    queryFn: () => customersApi.get(id!),
    enabled: Boolean(id),
  });
}
