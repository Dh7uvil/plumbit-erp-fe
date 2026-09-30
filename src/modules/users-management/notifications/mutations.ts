"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "@/modules/users-management/notifications/api";
import { notificationKeys } from "@/modules/users-management/notifications/queries";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const unreadKey = useTenantQueryKey(notificationKeys.unreadCount());

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: unreadKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const unreadKey = useTenantQueryKey(notificationKeys.unreadCount());

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.setQueryData(unreadKey, { count: 0 });
    },
  });
}
