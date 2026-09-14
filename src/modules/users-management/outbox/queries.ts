"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { outboxApi } from "@/modules/users-management/outbox/api";
import type { OutboxListParams } from "@/modules/users-management/outbox/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const outboxKeys = {
  all: ["outbox-events"] as const,
  list: (params: OutboxListParams) => [...outboxKeys.all, "list", params] as const,
  detail: (id: string) => [...outboxKeys.all, "detail", id] as const,
};

export function useOutboxEvents(params: OutboxListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(outboxKeys.list(params)),
    queryFn: () => outboxApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOutboxEvent(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(outboxKeys.detail(id ?? "")),
    queryFn: () => outboxApi.byId(id!),
    enabled: Boolean(id),
  });
}
