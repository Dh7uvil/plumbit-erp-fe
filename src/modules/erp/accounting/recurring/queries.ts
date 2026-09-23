"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { recurringApi } from "@/modules/erp/accounting/recurring/api";
import type { RecurringListParams } from "@/modules/erp/accounting/recurring/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const recurringKeys = {
  all: ["recurring-templates"] as const,
  list: (params: RecurringListParams) => [...recurringKeys.all, "list", params] as const,
  detail: (id: string) => [...recurringKeys.all, "detail", id] as const,
};

export function useRecurringTemplates(params: RecurringListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(recurringKeys.list(params)),
    queryFn: () => recurringApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useRecurringTemplate(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(recurringKeys.detail(id ?? "")),
    queryFn: () => recurringApi.get(id!),
    enabled: Boolean(id),
  });
}
