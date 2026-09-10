"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { deliveryNotesApi } from "@/modules/inventory-management/delivery-notes/api";
import type { DeliveryNoteListParams } from "@/modules/inventory-management/delivery-notes/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const deliveryNoteKeys = {
  all: ["delivery-notes"] as const,
  list: (params: DeliveryNoteListParams) => [...deliveryNoteKeys.all, "list", params] as const,
  detail: (id: string) => [...deliveryNoteKeys.all, "detail", id] as const,
};

export function useDeliveryNotes(params: DeliveryNoteListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(deliveryNoteKeys.list(params)),
    queryFn: () => deliveryNotesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDeliveryNote(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(deliveryNoteKeys.detail(id ?? "")),
    queryFn: () => deliveryNotesApi.get(id!),
    enabled: Boolean(id),
  });
}
