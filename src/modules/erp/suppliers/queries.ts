"use client";

import { useQuery } from "@tanstack/react-query";

import { suppliersApi } from "@/modules/erp/suppliers/api";
import type { SupplierListParams } from "@/modules/erp/suppliers/schemas";

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: (params: SupplierListParams) => [...supplierKeys.all, "list", params] as const,
  allItems: () => [...supplierKeys.all, "all"] as const,
  detail: (id: string) => [...supplierKeys.all, "detail", id] as const,
};

export function useSuppliers(params: SupplierListParams) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersApi.list(params),
  });
}

export function useAllSuppliers(enabled = true) {
  return useQuery({
    queryKey: supplierKeys.allItems(),
    queryFn: suppliersApi.listAll,
    enabled,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: supplierKeys.detail(id ?? ""),
    queryFn: () => suppliersApi.get(id!),
    enabled: Boolean(id),
  });
}
