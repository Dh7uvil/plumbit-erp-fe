"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { budgetsApi } from "@/modules/erp/accounting/budgets/api";
import { budgetKeys } from "@/modules/erp/accounting/budgets/queries";

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useActivateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      budgetsApi.activate(id, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useCloseBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => budgetsApi.close(id, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
