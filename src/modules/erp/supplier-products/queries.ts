"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { supplierProductsApi } from "@/modules/erp/supplier-products/api";
import type { SupplierProductListParams } from "@/modules/erp/supplier-products/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const supplierProductKeys = {
  all: ["supplier-products"] as const,
  list: (params: SupplierProductListParams) =>
    [...supplierProductKeys.all, "list", params] as const,
  allItems: (params: SupplierProductListParams = {}) =>
    [...supplierProductKeys.all, "all", params] as const,
  detail: (id: string) => [...supplierProductKeys.all, "detail", id] as const,
  resolve: (supplierId: string, supplierSku: string) =>
    [...supplierProductKeys.all, "resolve", supplierId, supplierSku] as const,
};

export function useSupplierProducts(params: SupplierProductListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(supplierProductKeys.list(params)),
    queryFn: () => supplierProductsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAllSupplierProducts(params: SupplierProductListParams = {}, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(supplierProductKeys.allItems(params)),
    queryFn: () => supplierProductsApi.listAll(params),
    enabled,
  });
}

export function useSupplierProduct(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(supplierProductKeys.detail(id ?? "")),
    queryFn: () => supplierProductsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useResolveSupplierSku(
  supplierId: string | null,
  supplierSku: string,
  enabled = true,
) {
  const sku = supplierSku.trim();
  return useQuery({
    queryKey: useTenantQueryKey(supplierProductKeys.resolve(supplierId ?? "", sku)),
    queryFn: () => supplierProductsApi.resolve(supplierId!, sku),
    enabled: Boolean(supplierId) && Boolean(sku) && enabled,
  });
}
