"use client";

import { useQuery } from "@tanstack/react-query";

import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import { tablePreferencesApi } from "@/shared/table-preferences/api";

export const tablePreferenceKeys = {
  all: ["table-preferences"] as const,
  detail: (tableKey: string) => [...tablePreferenceKeys.all, tableKey] as const,
};

export function useTableColumnPreferences(tableKey: string) {
  return useQuery({
    queryKey: useTenantQueryKey(tablePreferenceKeys.detail(tableKey)),
    queryFn: () => tablePreferencesApi.get(tableKey),
    staleTime: 5 * 60_000,
  });
}
