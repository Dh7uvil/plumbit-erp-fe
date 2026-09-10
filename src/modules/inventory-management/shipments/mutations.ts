"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deliveryNoteKeys } from "@/modules/inventory-management/delivery-notes/queries";
import { shipmentsApi } from "@/modules/inventory-management/shipments/api";
import { shipmentKeys } from "@/modules/inventory-management/shipments/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateShipments(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: shipmentKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shipmentsApi.create,
    onSuccess: async () => {
      await invalidateShipments(queryClient);
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof shipmentsApi.update>[1];
      version: number;
    }) => shipmentsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

function useShipmentAction(
  mutationFn: (id: string, options: { version: number }) => ReturnType<typeof shipmentsApi.dispatch>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDispatchShipment() {
  return useShipmentAction(shipmentsApi.dispatch);
}
export function useArriveShipment() {
  return useShipmentAction(shipmentsApi.arrive);
}
export function useCloseShipment() {
  return useShipmentAction(shipmentsApi.close);
}
export function useCancelShipment() {
  return useShipmentAction(shipmentsApi.cancel);
}

export function useUpdateShipmentTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof shipmentsApi.updateTracking>[1];
      version: number;
    }) => shipmentsApi.updateTracking(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useAttachDeliveryNotesToShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveryNoteIds }: { id: string; deliveryNoteIds: string[] }) =>
      shipmentsApi.attachDeliveryNotes(id, deliveryNoteIds),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
  });
}

export function useDetachDeliveryNoteFromShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, noteId }: { id: string; noteId: string }) =>
      shipmentsApi.detachDeliveryNote(id, noteId),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => shipmentsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateShipments(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
