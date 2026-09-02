"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { unitsApi } from "@/modules/inventory-management/units/api";
import type { UnitListParams } from "@/modules/inventory-management/units/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const unitKeys = {
  all: ["units"] as const,
  list: (params: UnitListParams) => [...unitKeys.all, "list", params] as const,
  allItems: () => [...unitKeys.all, "all"] as const,
  detail: (id: string) => [...unitKeys.all, "detail", id] as const,
};

export function useUnits(params: UnitListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(unitKeys.list(params)),
    queryFn: () => unitsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllUnits(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(unitKeys.allItems()),
    queryFn: unitsApi.listAll,
    enabled,
  });
}

export function useUnit(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(unitKeys.detail(id ?? "")),
    queryFn: () => unitsApi.get(id!),
    enabled: Boolean(id),
  });
}
