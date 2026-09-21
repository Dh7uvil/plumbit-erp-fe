"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { leadsApi } from "@/modules/crm/leads/api";
import type { LeadListParams } from "@/modules/crm/leads/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const leadKeys = {
  all: ["leads"] as const,
  list: (params: LeadListParams) => [...leadKeys.all, "list", params] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};

export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(leadKeys.list(params)),
    queryFn: () => leadsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(leadKeys.detail(id ?? "")),
    queryFn: () => leadsApi.get(id!),
    enabled: Boolean(id),
  });
}
