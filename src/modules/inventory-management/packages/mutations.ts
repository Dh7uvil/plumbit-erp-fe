"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deliveryNoteKeys } from "@/modules/inventory-management/delivery-notes/queries";
import { packagesApi } from "@/modules/inventory-management/packages/api";
import { packageKeys } from "@/modules/inventory-management/packages/queries";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidatePackages(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: packageKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: packageKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.all });
  await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: packageKeys.detail(id) });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: packagesApi.create,
    onSuccess: async () => {
      await invalidatePackages(queryClient);
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof packagesApi.update>[1];
      version: number;
    }) => packagesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePackages(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function usePackPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => packagesApi.pack(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePackages(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => packagesApi.cancel(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePackages(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => packagesApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidatePackages(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
