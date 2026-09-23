"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fxRevaluationApi } from "@/modules/erp/accounting/fx-revaluation/api";
import { fxRevaluationKeys } from "@/modules/erp/accounting/fx-revaluation/queries";

export function useRunFxRevaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fxRevaluationApi.run,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fxRevaluationKeys.all });
    },
  });
}

export function useReverseFxRevaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      reversalDate,
    }: {
      id: string;
      version: number;
      reversalDate: string;
    }) => fxRevaluationApi.reverse(id, version, reversalDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fxRevaluationKeys.all });
    },
  });
}
