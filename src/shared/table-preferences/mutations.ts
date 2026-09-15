"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import { tablePreferencesApi } from "@/shared/table-preferences/api";
import { tablePreferenceKeys } from "@/shared/table-preferences/queries";
import type { TablePreferenceUpdate } from "@/shared/table-preferences/schemas";

export function useSaveTableColumnPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = useTenantQueryKey(tablePreferenceKeys.detail(tableKey));
  return useMutation({
    mutationFn: (values: TablePreferenceUpdate) => tablePreferencesApi.put(tableKey, values),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

export function useResetTableColumnPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = useTenantQueryKey(tablePreferenceKeys.detail(tableKey));
  return useMutation({
    mutationFn: () => tablePreferencesApi.reset(tableKey),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
