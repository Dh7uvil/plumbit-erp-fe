import { useQuery } from "@tanstack/react-query";

import { bankReconciliationApi } from "@/modules/erp/accounting/bank-reconciliation/api";
import type { BankStatementListParams } from "@/modules/erp/accounting/bank-reconciliation/schemas";

export const bankReconciliationKeys = {
  all: ["bank-reconciliation"] as const,
  list: (params: BankStatementListParams) =>
    [...bankReconciliationKeys.all, "list", params] as const,
  detail: (id: string) => [...bankReconciliationKeys.all, "detail", id] as const,
  bookEntries: (id: string) => [...bankReconciliationKeys.all, "book-entries", id] as const,
  suggestions: (id: string) => [...bankReconciliationKeys.all, "suggestions", id] as const,
  summary: (id: string) => [...bankReconciliationKeys.all, "summary", id] as const,
};

export function useBankStatements(params: BankStatementListParams = {}) {
  return useQuery({
    queryKey: bankReconciliationKeys.list(params),
    queryFn: () => bankReconciliationApi.list(params),
  });
}

export function useBankStatement(id: string) {
  return useQuery({
    queryKey: bankReconciliationKeys.detail(id),
    queryFn: () => bankReconciliationApi.get(id),
    enabled: Boolean(id),
  });
}

export function useBookEntries(id: string) {
  return useQuery({
    queryKey: bankReconciliationKeys.bookEntries(id),
    queryFn: () => bankReconciliationApi.bookEntries(id),
    enabled: Boolean(id),
  });
}

export function useMatchSuggestions(id: string) {
  return useQuery({
    queryKey: bankReconciliationKeys.suggestions(id),
    queryFn: () => bankReconciliationApi.suggestedMatches(id),
    enabled: Boolean(id),
  });
}

export function useReconciliationSummary(id: string) {
  return useQuery({
    queryKey: bankReconciliationKeys.summary(id),
    queryFn: () => bankReconciliationApi.reconciliationStatement(id),
    enabled: Boolean(id),
  });
}
