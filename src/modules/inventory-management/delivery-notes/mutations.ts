"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { deliveryNotesApi } from "@/modules/inventory-management/delivery-notes/api";
import { deliveryNoteKeys } from "@/modules/inventory-management/delivery-notes/queries";
import { packageKeys } from "@/modules/inventory-management/packages/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateNotes(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
  await queryClient.invalidateQueries({ queryKey: packageKeys.all });
  if (stockMoved) {
    await queryClient.invalidateQueries({ queryKey: stockKeys.all });
  }
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.detail(id) });
}

export function useCreateDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryNotesApi.create,
    onSuccess: async () => {
      await invalidateNotes(queryClient);
    },
  });
}

export function useCreateDeliveryNoteFromSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deliveryNotesApi.createFromSalesOrder,
    onSuccess: async () => {
      await invalidateNotes(queryClient);
    },
  });
}

export function useUpdateDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof deliveryNotesApi.update>[1];
      version: number;
    }) => deliveryNotesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateNotes(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePostDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => deliveryNotesApi.post(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateNotes(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      deliveryNotesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateNotes(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => deliveryNotesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateNotes(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useAttachPackageToDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, packageId }: { noteId: string; packageId: string }) =>
      deliveryNotesApi.attachPackage(noteId, packageId),
    onSuccess: async (_data, { noteId }) => {
      await invalidateNotes(queryClient, noteId);
    },
  });
}

export function useDetachPackageFromDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, packageId }: { noteId: string; packageId: string }) =>
      deliveryNotesApi.detachPackage(noteId, packageId),
    onSuccess: async (_data, { noteId }) => {
      await invalidateNotes(queryClient, noteId);
    },
  });
}
