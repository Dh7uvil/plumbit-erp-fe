"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { notificationsApi } from "@/modules/users-management/notifications/api";
import type { NotificationListParams } from "@/modules/users-management/notifications/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) => [...notificationKeys.all, "list", params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: useTenantQueryKey(notificationKeys.list(params)),
    queryFn: () => notificationsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: useTenantQueryKey(notificationKeys.unreadCount()),
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
