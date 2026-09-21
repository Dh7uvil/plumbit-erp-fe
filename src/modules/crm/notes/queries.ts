"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { notesApi } from "@/modules/crm/notes/api";
import type { NoteListParams } from "@/modules/crm/notes/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const noteKeys = {
  all: ["notes"] as const,
  list: (params: NoteListParams) => [...noteKeys.all, "list", params] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
};

export function useNotes(params: NoteListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(noteKeys.list(params)),
    queryFn: () => notesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(noteKeys.detail(id ?? "")),
    queryFn: () => notesApi.get(id!),
    enabled: Boolean(id),
  });
}
