"use client";

import { useQuery } from "@tanstack/react-query";

import { presenceApi } from "@/modules/communication/presence/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const presenceKeys = {
  all: ["communication", "presence"] as const,
  users: (userIds: string[]) => [...presenceKeys.all, "users", ...userIds.sort()] as const,
};

export function usePresence(userIds: string[]) {
  const sorted = [...userIds].sort();
  return useQuery({
    queryKey: useTenantQueryKey(presenceKeys.users(sorted)),
    queryFn: () => presenceApi.getPresence(sorted),
    enabled: sorted.length > 0,
    refetchInterval: 30_000,
  });
}
