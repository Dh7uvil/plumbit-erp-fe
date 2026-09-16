"use client";

import { useQuery } from "@tanstack/react-query";

import { settingsApi } from "@/modules/users-management/settings/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const settingsKeys = {
  all: ["settings"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: useTenantQueryKey(settingsKeys.notifications()),
    queryFn: settingsApi.getNotificationPreferences,
  });
}
