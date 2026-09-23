"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { recurringApi } from "@/modules/erp/accounting/recurring/api";
import { recurringKeys } from "@/modules/erp/accounting/recurring/queries";

export function useCreateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function useGenerateRecurringDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recurringApi.generate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}
