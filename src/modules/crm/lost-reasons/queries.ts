"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { lostReasonsApi } from "@/modules/crm/lost-reasons/api";
import type { LostReasonListParams } from "@/modules/crm/lost-reasons/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const lostReasonKeys = {
  all: ["lost-reasons"] as const,
  list: (params: LostReasonListParams) => [...lostReasonKeys.all, "list", params] as const,
  allItems: () => [...lostReasonKeys.all, "all"] as const,
  detail: (id: string) => [...lostReasonKeys.all, "detail", id] as const,
};

export function useLostReasons(params: LostReasonListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(lostReasonKeys.list(params)),
    queryFn: () => lostReasonsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllLostReasons(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(lostReasonKeys.allItems()),
    queryFn: lostReasonsApi.listAll,
    enabled,
  });
}

export function useLostReason(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(lostReasonKeys.detail(id ?? "")),
    queryFn: () => lostReasonsApi.get(id!),
    enabled: Boolean(id),
  });
}
