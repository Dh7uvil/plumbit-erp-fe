"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customerKeys } from "@/modules/crm/customers/queries";
import { suppliersApi } from "@/modules/erp/suppliers/api";
import { supplierKeys } from "@/modules/erp/suppliers/queries";

async function invalidatePartyCaches(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: supplierKeys.all });
  await queryClient.invalidateQueries({ queryKey: customerKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    await queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
  }
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: async () => {
      await invalidatePartyCaches(queryClient);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof suppliersApi.update>[1];
    }) => suppliersApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePartyCaches(queryClient, id);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: async () => {
      await invalidatePartyCaches(queryClient);
    },
  });
}

export function useAddSupplierAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof suppliersApi.addAddress>[1];
    }) => suppliersApi.addAddress(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidatePartyCaches(queryClient, id);
    },
  });
}

export function useDeleteSupplierAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extraId }: { id: string; extraId: string }) =>
      suppliersApi.deleteAddress(id, extraId),
    onSuccess: async (_data, { id }) => {
      await invalidatePartyCaches(queryClient, id);
    },
  });
}
