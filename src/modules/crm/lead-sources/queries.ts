"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { leadSourcesApi } from "@/modules/crm/lead-sources/api";
import type { LeadSourceListParams } from "@/modules/crm/lead-sources/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const leadSourceKeys = {
  all: ["lead-sources"] as const,
  list: (params: LeadSourceListParams) => [...leadSourceKeys.all, "list", params] as const,
  allItems: () => [...leadSourceKeys.all, "all"] as const,
  detail: (id: string) => [...leadSourceKeys.all, "detail", id] as const,
};

export function useLeadSources(params: LeadSourceListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(leadSourceKeys.list(params)),
    queryFn: () => leadSourcesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllLeadSources(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(leadSourceKeys.allItems()),
    queryFn: leadSourcesApi.listAll,
    enabled,
  });
}

export function useLeadSource(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(leadSourceKeys.detail(id ?? "")),
    queryFn: () => leadSourcesApi.get(id!),
    enabled: Boolean(id),
  });
}
