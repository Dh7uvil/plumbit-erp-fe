"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { salesReturnsApi } from "@/modules/inventory-management/sales-returns/api";
import type { SalesReturnListParams } from "@/modules/inventory-management/sales-returns/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const salesReturnKeys = {
  all: ["sales-returns"] as const,
  list: (params: SalesReturnListParams) => [...salesReturnKeys.all, "list", params] as const,
  detail: (id: string) => [...salesReturnKeys.all, "detail", id] as const,
};

export function useSalesReturns(params: SalesReturnListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(salesReturnKeys.list(params)),
    queryFn: () => salesReturnsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSalesReturn(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(salesReturnKeys.detail(id ?? "")),
    queryFn: () => salesReturnsApi.get(id!),
    enabled: Boolean(id),
  });
}
