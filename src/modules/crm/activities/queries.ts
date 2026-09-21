"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { activitiesApi } from "@/modules/crm/activities/api";
import type { ActivityListParams } from "@/modules/crm/activities/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const activityKeys = {
  all: ["activities"] as const,
  list: (params: ActivityListParams) => [...activityKeys.all, "list", params] as const,
  detail: (id: string) => [...activityKeys.all, "detail", id] as const,
};

export function useActivities(params: ActivityListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(activityKeys.list(params)),
    queryFn: () => activitiesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(activityKeys.detail(id ?? "")),
    queryFn: () => activitiesApi.get(id!),
    enabled: Boolean(id),
  });
}
