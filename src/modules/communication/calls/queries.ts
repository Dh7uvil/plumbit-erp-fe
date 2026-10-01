"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { callsApi } from "@/modules/communication/calls/api";
import type { CallListParams } from "@/modules/communication/calls/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const callKeys = {
  all: ["communication", "calls"] as const,
  list: (params: CallListParams) => [...callKeys.all, "list", params] as const,
  detail: (id: string) => [...callKeys.all, "detail", id] as const,
};

export function useCalls(params: CallListParams = {}) {
  return useQuery({
    queryKey: useTenantQueryKey(callKeys.list(params)),
    queryFn: () => callsApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
    throwOnError: false,
  });
}

export function useCall(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(callKeys.detail(id ?? "")),
    queryFn: () => callsApi.get(id!),
    enabled: Boolean(id),
  });
}
