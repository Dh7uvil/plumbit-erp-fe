"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { creditNotesApi } from "@/modules/erp/credit-notes/api";
import type { CreditNoteListParams } from "@/modules/erp/credit-notes/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const creditNoteKeys = {
  all: ["credit-notes"] as const,
  list: (params: CreditNoteListParams) => [...creditNoteKeys.all, "list", params] as const,
  detail: (id: string) => [...creditNoteKeys.all, "detail", id] as const,
};

export function useCreditNotes(params: CreditNoteListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(creditNoteKeys.list(params)),
    queryFn: () => creditNotesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreditNote(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(creditNoteKeys.detail(id ?? "")),
    queryFn: () => creditNotesApi.get(id!),
    enabled: Boolean(id),
  });
}
