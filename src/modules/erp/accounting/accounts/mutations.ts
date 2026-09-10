"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { accountsApi } from "@/modules/erp/accounting/accounts/api";
import { accountKeys } from "@/modules/erp/accounting/accounts/queries";
import type { AccountFormValues } from "@/modules/erp/accounting/accounts/schemas";

async function invalidateAccounts(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: accountKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
  }
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: async () => {
      await invalidateAccounts(queryClient);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      isSystem,
    }: {
      id: string;
      values: AccountFormValues;
      isSystem?: boolean;
    }) => accountsApi.update(id, values, isSystem),
    onSuccess: async (_data, { id }) => {
      await invalidateAccounts(queryClient, id);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: async () => {
      await invalidateAccounts(queryClient);
    },
  });
}

export function useMapSystemRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, accountId }: { role: string; accountId: string }) =>
      accountsApi.mapSystemRole(role, accountId),
    onSuccess: async () => {
      await invalidateAccounts(queryClient);
    },
  });
}
