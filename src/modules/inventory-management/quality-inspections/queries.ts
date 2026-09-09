"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { qualityInspectionsApi } from "@/modules/inventory-management/quality-inspections/api";
import type { QualityInspectionListParams } from "@/modules/inventory-management/quality-inspections/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const qualityInspectionKeys = {
  all: ["quality-inspections"] as const,
  list: (params: QualityInspectionListParams) =>
    [...qualityInspectionKeys.all, "list", params] as const,
  detail: (id: string) => [...qualityInspectionKeys.all, "detail", id] as const,
};

export function useQualityInspections(params: QualityInspectionListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(qualityInspectionKeys.list(params)),
    queryFn: () => qualityInspectionsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useQualityInspection(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(qualityInspectionKeys.detail(id ?? "")),
    queryFn: () => qualityInspectionsApi.get(id!),
    enabled: Boolean(id),
  });
}
