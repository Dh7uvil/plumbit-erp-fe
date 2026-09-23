"use client";

import { useQuery } from "@tanstack/react-query";

import { fxRevaluationApi } from "@/modules/erp/accounting/fx-revaluation/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const fxRevaluationKeys = {
  all: ["fx-revaluations"] as const,
  list: () => [...fxRevaluationKeys.all, "list"] as const,
  detail: (id: string) => [...fxRevaluationKeys.all, "detail", id] as const,
  exposure: (asOf: string) => [...fxRevaluationKeys.all, "exposure", asOf] as const,
};

export function useFxRevaluations() {
  return useQuery({
    queryKey: useTenantQueryKey(fxRevaluationKeys.list()),
    queryFn: fxRevaluationApi.list,
  });
}

export function useFxRevaluation(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(fxRevaluationKeys.detail(id ?? "")),
    queryFn: () => fxRevaluationApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useFxExposure(asOf: string) {
  return useQuery({
    queryKey: useTenantQueryKey(fxRevaluationKeys.exposure(asOf)),
    queryFn: () => fxRevaluationApi.exposure(asOf),
    enabled: Boolean(asOf),
  });
}
