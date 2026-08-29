"use client";

import { useQuery } from "@tanstack/react-query";

import { warehousesApi } from "@/modules/inventory-management/warehouses/api";
import type { WarehouseListParams } from "@/modules/inventory-management/warehouses/schemas";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  list: (params: WarehouseListParams) => [...warehouseKeys.all, "list", params] as const,
  allItems: () => [...warehouseKeys.all, "all"] as const,
  detail: (id: string) => [...warehouseKeys.all, "detail", id] as const,
};

export function useWarehouses(params: WarehouseListParams) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehousesApi.list(params),
  });
}

export function useAllWarehouses(enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.allItems(),
    queryFn: warehousesApi.listAll,
    enabled,
  });
}

export function useWarehouse(id: string | null) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ""),
    queryFn: () => warehousesApi.get(id!),
    enabled: Boolean(id),
  });
}
