import { useMutation, useQueryClient } from "@tanstack/react-query";

import { bankReconciliationApi } from "@/modules/erp/accounting/bank-reconciliation/api";
import { bankReconciliationKeys } from "@/modules/erp/accounting/bank-reconciliation/queries";

export function useCreateBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => bankReconciliationApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.all }),
  });
}

export function useMatchStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { statement_line_id: string; journal_line_id: string; version: number };
    }) => bankReconciliationApi.match(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.bookEntries(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.suggestions(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.summary(id) });
    },
  });
}

export function useUnmatchStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { statement_line_id: string; version: number };
    }) => bankReconciliationApi.unmatch(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.bookEntries(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.suggestions(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.summary(id) });
    },
  });
}

export function useExcludeStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { statement_line_id: string; version: number };
    }) => bankReconciliationApi.exclude(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.summary(id) });
    },
  });
}

export function useReconcileBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      bankReconciliationApi.reconcile(id, version),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.all });
      queryClient.invalidateQueries({ queryKey: bankReconciliationKeys.detail(id) });
    },
  });
}
