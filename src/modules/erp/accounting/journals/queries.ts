"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { journalsApi } from "@/modules/erp/accounting/journals/api";
import type { JournalListParams } from "@/modules/erp/accounting/journals/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const journalKeys = {
  all: ["journals"] as const,
  list: (params: JournalListParams) => [...journalKeys.all, "list", params] as const,
  detail: (id: string) => [...journalKeys.all, "detail", id] as const,
};

export function useJournals(params: JournalListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(journalKeys.list(params)),
    queryFn: () => journalsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useJournal(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(journalKeys.detail(id ?? "")),
    queryFn: () => journalsApi.get(id!),
    enabled: Boolean(id),
  });
}
