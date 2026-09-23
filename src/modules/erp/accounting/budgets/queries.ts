"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { budgetsApi } from "@/modules/erp/accounting/budgets/api";
import type { BudgetListParams } from "@/modules/erp/accounting/budgets/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const budgetKeys = {
  all: ["budgets"] as const,
  list: (params: BudgetListParams) => [...budgetKeys.all, "list", params] as const,
  detail: (id: string) => [...budgetKeys.all, "detail", id] as const,
  vsActual: (id: string, from: string, to: string) =>
    [...budgetKeys.all, "vs-actual", id, from, to] as const,
};

export function useBudgets(params: BudgetListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(budgetKeys.list(params)),
    queryFn: () => budgetsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useBudget(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(budgetKeys.detail(id ?? "")),
    queryFn: () => budgetsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useBudgetVsActual(id: string | null, from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(budgetKeys.vsActual(id ?? "", from, to)),
    queryFn: () => budgetsApi.vsActual(id!, from, to),
    enabled: Boolean(id) && enabled,
  });
}
