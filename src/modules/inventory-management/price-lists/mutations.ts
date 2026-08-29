"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { priceListsApi } from "@/modules/inventory-management/price-lists/api";
import { priceListKeys } from "@/modules/inventory-management/price-lists/queries";

async function invalidatePriceLists(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: priceListKeys.all });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: priceListsApi.create,
    onSuccess: async () => {
      await invalidatePriceLists(queryClient);
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof priceListsApi.update>[1];
    }) => priceListsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePriceLists(queryClient);
      await queryClient.invalidateQueries({ queryKey: priceListKeys.detail(id) });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: priceListsApi.delete,
    onSuccess: async () => {
      await invalidatePriceLists(queryClient);
    },
  });
}

export function useUpsertPriceListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof priceListsApi.upsertItem>[1];
    }) => priceListsApi.upsertItem(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePriceLists(queryClient);
      await queryClient.invalidateQueries({ queryKey: priceListKeys.detail(id) });
    },
  });
}

export function useDeletePriceListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      priceListsApi.deleteItem(id, productId),
    onSuccess: async (_data, { id }) => {
      await invalidatePriceLists(queryClient);
      await queryClient.invalidateQueries({ queryKey: priceListKeys.detail(id) });
    },
  });
}
