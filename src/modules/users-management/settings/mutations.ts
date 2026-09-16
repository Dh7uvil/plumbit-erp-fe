"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/modules/users-management/auth/queries";
import { settingsApi } from "@/modules/users-management/settings/api";
import { settingsKeys } from "@/modules/users-management/settings/queries";
import type {
  MeUpdate,
  NotificationPreferenceUpdate,
} from "@/modules/users-management/settings/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MeUpdate) => settingsApi.updateMe(values),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data);
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const queryKey = useTenantQueryKey(settingsKeys.notifications());
  return useMutation({
    mutationFn: (values: NotificationPreferenceUpdate) =>
      settingsApi.updateNotificationPreferences(values),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
