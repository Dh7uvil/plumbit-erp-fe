"use client";

import { useQuery } from "@tanstack/react-query";

import { communicationSettingsApi } from "@/modules/communication/settings/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const communicationSettingsKeys = {
  all: ["communication", "settings"] as const,
  notifications: () => [...communicationSettingsKeys.all, "notifications"] as const,
};

export function useCommunicationSettings() {
  return useQuery({
    queryKey: useTenantQueryKey(communicationSettingsKeys.notifications()),
    queryFn: () => communicationSettingsApi.get(),
  });
}
