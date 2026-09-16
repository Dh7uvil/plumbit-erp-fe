"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { activityApi } from "@/modules/users-management/activity/api";
import type { ActivityListParams } from "@/modules/users-management/activity/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const activityKeys = {
  all: ["activity"] as const,
  list: (params: ActivityListParams) => [...activityKeys.all, "list", params] as const,
  forEntity: (entityType: string, entityId: string, revision?: number | string) =>
    [...activityKeys.all, "entity", entityType, entityId, revision ?? ""] as const,
};

export function useEntityActivity(
  entityType: string,
  entityId: string | null,
  revision?: number | string,
  options: { enabled?: boolean; pageSize?: number } = {},
) {
  const enabled = options.enabled ?? true;
  const pageSize = options.pageSize;
  return useQuery({
    queryKey: useTenantQueryKey([
      ...activityKeys.forEntity(entityType, entityId ?? "", revision),
      pageSize ?? "default",
    ]),
    queryFn: () =>
      activityApi.list({
        entity_type: entityType,
        entity_id: entityId!,
        sort_by: "created_at",
        sort_order: "desc",
        page_size: pageSize,
      }),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(entityId),
  });
}
