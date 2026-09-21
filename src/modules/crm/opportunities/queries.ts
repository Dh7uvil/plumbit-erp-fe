"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { opportunitiesApi } from "@/modules/crm/opportunities/api";
import type { OpportunityListParams } from "@/modules/crm/opportunities/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const opportunityKeys = {
  all: ["opportunities"] as const,
  list: (params: OpportunityListParams) => [...opportunityKeys.all, "list", params] as const,
  detail: (id: string) => [...opportunityKeys.all, "detail", id] as const,
};

export function useOpportunities(params: OpportunityListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(opportunityKeys.list(params)),
    queryFn: () => opportunitiesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOpportunity(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(opportunityKeys.detail(id ?? "")),
    queryFn: () => opportunitiesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useOpportunityQuotations(opportunityId: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey([...opportunityKeys.detail(opportunityId ?? ""), "quotations"]),
    queryFn: () => opportunitiesApi.listQuotations(opportunityId!),
    enabled: enabled && Boolean(opportunityId),
  });
}
