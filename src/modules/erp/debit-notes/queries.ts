"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { debitNotesApi } from "@/modules/erp/debit-notes/api";
import type { DebitNoteListParams } from "@/modules/erp/debit-notes/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const debitNoteKeys = {
  all: ["debit-notes"] as const,
  list: (params: DebitNoteListParams) => [...debitNoteKeys.all, "list", params] as const,
  detail: (id: string) => [...debitNoteKeys.all, "detail", id] as const,
};

export function useDebitNotes(params: DebitNoteListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(debitNoteKeys.list(params)),
    queryFn: () => debitNotesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDebitNote(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(debitNoteKeys.detail(id ?? "")),
    queryFn: () => debitNotesApi.get(id!),
    enabled: Boolean(id),
  });
}
