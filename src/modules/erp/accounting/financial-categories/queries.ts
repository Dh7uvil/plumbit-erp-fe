"use client";

import { useQuery } from "@tanstack/react-query";

import { financialCategoriesApi } from "@/modules/erp/accounting/financial-categories/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useAllFinancialCategories(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(["financial-categories", "all"]),
    queryFn: financialCategoriesApi.listAll,
    enabled,
  });
}
