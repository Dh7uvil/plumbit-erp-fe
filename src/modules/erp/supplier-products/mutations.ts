"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supplierProductsApi } from "@/modules/erp/supplier-products/api";
import { supplierProductKeys } from "@/modules/erp/supplier-products/queries";
import { productKeys } from "@/modules/inventory-management/products/queries";

async function invalidateCatalog(
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { id?: string; products?: boolean },
) {
  await queryClient.invalidateQueries({ queryKey: supplierProductKeys.all });
  if (options?.id) {
    await queryClient.invalidateQueries({ queryKey: supplierProductKeys.detail(options.id) });
  }
  if (options?.products) {
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  }
}

export function useCreateSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierProductsApi.create,
    onSuccess: async () => {
      await invalidateCatalog(queryClient);
    },
  });
}

export function useUpdateSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof supplierProductsApi.update>[1];
    }) => supplierProductsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCatalog(queryClient, { id });
    },
  });
}

export function useDeleteSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierProductsApi.delete,
    onSuccess: async () => {
      await invalidateCatalog(queryClient);
    },
  });
}

export function useLinkSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      supplierProductsApi.link(id, productId),
    onSuccess: async (_data, { id }) => {
      await invalidateCatalog(queryClient, { id, products: true });
    },
  });
}

export function useUnlinkSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierProductsApi.unlink,
    onSuccess: async (_data, id) => {
      await invalidateCatalog(queryClient, { id, products: true });
    },
  });
}
