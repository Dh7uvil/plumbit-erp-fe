"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { shipmentsApi } from "@/modules/inventory-management/shipments/api";
import type { ShipmentListParams } from "@/modules/inventory-management/shipments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const shipmentKeys = {
  all: ["shipments"] as const,
  list: (params: ShipmentListParams) => [...shipmentKeys.all, "list", params] as const,
  detail: (id: string) => [...shipmentKeys.all, "detail", id] as const,
};

export function useShipments(params: ShipmentListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(shipmentKeys.list(params)),
    queryFn: () => shipmentsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useShipment(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(shipmentKeys.detail(id ?? "")),
    queryFn: () => shipmentsApi.get(id!),
    enabled: Boolean(id),
  });
}
