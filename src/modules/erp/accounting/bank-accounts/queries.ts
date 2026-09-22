import { useQuery } from "@tanstack/react-query";

import { bankAccountsApi } from "@/modules/erp/accounting/bank-accounts/api";
import type { BankAccountListParams } from "@/modules/erp/accounting/bank-accounts/schemas";

export const bankAccountKeys = {
  all: ["bank-accounts"] as const,
  list: (params: BankAccountListParams) => [...bankAccountKeys.all, "list", params] as const,
  detail: (id: string) => [...bankAccountKeys.all, "detail", id] as const,
};

export function useBankAccounts(params: BankAccountListParams = {}) {
  return useQuery({
    queryKey: bankAccountKeys.list(params),
    queryFn: () => bankAccountsApi.list(params),
  });
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: bankAccountKeys.detail(id),
    queryFn: () => bankAccountsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useAllBankAccounts() {
  return useQuery({
    queryKey: [...bankAccountKeys.all, "all"],
    queryFn: () => bankAccountsApi.listAll(),
  });
}
