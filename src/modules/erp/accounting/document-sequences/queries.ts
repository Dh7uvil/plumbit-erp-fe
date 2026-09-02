"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { documentSequencesApi } from "@/modules/erp/accounting/document-sequences/api";
import type { DocumentSequenceListParams } from "@/modules/erp/accounting/document-sequences/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const documentSequenceKeys = {
  all: ["document-sequences"] as const,
  list: (params: DocumentSequenceListParams) =>
    [...documentSequenceKeys.all, "list", params] as const,
  allItems: () => [...documentSequenceKeys.all, "all"] as const,
  detail: (id: string) => [...documentSequenceKeys.all, "detail", id] as const,
};

export function useDocumentSequences(params: DocumentSequenceListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(documentSequenceKeys.list(params)),
    queryFn: () => documentSequencesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllDocumentSequences(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(documentSequenceKeys.allItems()),
    queryFn: documentSequencesApi.listAll,
    enabled,
  });
}

export function useDocumentSequence(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(documentSequenceKeys.detail(id ?? "")),
    queryFn: () => documentSequencesApi.get(id!),
    enabled: Boolean(id),
  });
}
