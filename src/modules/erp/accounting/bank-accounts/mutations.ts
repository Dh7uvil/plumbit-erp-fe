import { useMutation, useQueryClient } from "@tanstack/react-query";

import { bankAccountsApi } from "@/modules/erp/accounting/bank-accounts/api";
import { bankAccountKeys } from "@/modules/erp/accounting/bank-accounts/queries";
import type {
  BankAccountCreateRequest,
  BankAccountUpdateRequest,
} from "@/modules/erp/accounting/bank-accounts/schemas";

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BankAccountCreateRequest) => bankAccountsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BankAccountUpdateRequest }) =>
      bankAccountsApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(id) });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankAccountsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
  });
}
