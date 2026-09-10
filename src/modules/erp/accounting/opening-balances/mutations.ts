"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "@/modules/erp/accounting/accounts/queries";
import { journalKeys } from "@/modules/erp/accounting/journals/queries";
import { openingBalancesApi } from "@/modules/erp/accounting/opening-balances/api";
import { openingBalanceKeys } from "@/modules/erp/accounting/opening-balances/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidateOpening(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: openingBalanceKeys.all });
  await queryClient.invalidateQueries({ queryKey: journalKeys.all });
  await queryClient.invalidateQueries({ queryKey: accountKeys.all });
  await queryClient.invalidateQueries({ queryKey: stockKeys.all });
  await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
}

export function usePreviewOpeningBalances() {
  return useMutation({
    mutationFn: openingBalancesApi.preview,
  });
}

export function useCommitOpeningBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openingBalancesApi.commit,
    onSuccess: async () => {
      await invalidateOpening(queryClient);
    },
  });
}

export function useResetOpeningBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openingBalancesApi.reset,
    onSuccess: async () => {
      await invalidateOpening(queryClient);
    },
  });
}
