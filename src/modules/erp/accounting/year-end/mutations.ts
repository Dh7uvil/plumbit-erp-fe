"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { yearEndApi } from "@/modules/erp/accounting/year-end/api";
import { yearEndKeys } from "@/modules/erp/accounting/year-end/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidateYearEnd(queryClient: ReturnType<typeof useQueryClient>, fiscalYear: number) {
  await queryClient.invalidateQueries({ queryKey: yearEndKeys.state(fiscalYear) });
  await queryClient.invalidateQueries({ queryKey: yearEndKeys.all });
  await queryClient.invalidateQueries({ queryKey: journalKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
  await queryClient.invalidateQueries({ queryKey: ["reports"] });
}

export function usePreviewYearEnd() {
  return useMutation({
    mutationFn: yearEndApi.preview,
  });
}

export function useCommitYearEnd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: yearEndApi.commit,
    onSuccess: async (_data, fiscalYear) => {
      await invalidateYearEnd(queryClient, fiscalYear);
    },
  });
}

export function useReopenYearEnd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: yearEndApi.reopen,
    onSuccess: async (_data, fiscalYear) => {
      await invalidateYearEnd(queryClient, fiscalYear);
    },
  });
}
