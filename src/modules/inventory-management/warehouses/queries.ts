"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { warehousesApi } from "@/modules/inventory-management/warehouses/api";
import type { WarehouseListParams } from "@/modules/inventory-management/warehouses/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  list: (params: WarehouseListParams) => [...warehouseKeys.all, "list", params] as const,
  allItems: () => [...warehouseKeys.all, "all"] as const,
  detail: (id: string) => [...warehouseKeys.all, "detail", id] as const,
};

export function useWarehouses(params: WarehouseListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(warehouseKeys.list(params)),
    queryFn: () => warehousesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllWarehouses(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(warehouseKeys.allItems()),
    queryFn: warehousesApi.listAll,
    enabled,
  });
}

export function useWarehouse(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(warehouseKeys.detail(id ?? "")),
    queryFn: () => warehousesApi.get(id!),
    enabled: Boolean(id),
  });
}
