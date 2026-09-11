"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { goodsReceiptLandedCostApi, landedCostsApi } from "@/modules/erp/landed-costs/api";
import type { LandedCostListParams } from "@/modules/erp/landed-costs/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const landedCostKeys = {
  all: ["landed-costs"] as const,
  list: (params: LandedCostListParams) => [...landedCostKeys.all, "list", params] as const,
  detail: (id: string) => [...landedCostKeys.all, "detail", id] as const,
  eligible: (receiptId: string) => [...landedCostKeys.all, "eligible", receiptId] as const,
};

export function useLandedCosts(params: LandedCostListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(landedCostKeys.list(params)),
    queryFn: () => landedCostsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useLandedCost(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(landedCostKeys.detail(id ?? "")),
    queryFn: () => landedCostsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useLandedCostEligible(receiptId: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(landedCostKeys.eligible(receiptId ?? "")),
    queryFn: () => goodsReceiptLandedCostApi.eligible(receiptId!),
    enabled: Boolean(receiptId),
  });
}
