import { useQuery } from "@tanstack/react-query";

import { dunningRulesApi, paymentRemindersApi } from "@/modules/erp/accounting/dunning-rules/api";
import type { DunningRuleListParams } from "@/modules/erp/accounting/dunning-rules/schemas";

export const dunningRuleKeys = {
  all: ["dunning-rules"] as const,
  list: (params: DunningRuleListParams) => [...dunningRuleKeys.all, "list", params] as const,
  detail: (id: string) => [...dunningRuleKeys.all, "detail", id] as const,
};

export function useDunningRules(params: DunningRuleListParams = {}, enabled = true) {
  return useQuery({
    queryKey: dunningRuleKeys.list(params),
    queryFn: () => dunningRulesApi.list(params),
    enabled,
  });
}

export function useDunningRule(id: string, enabled = true) {
  return useQuery({
    queryKey: dunningRuleKeys.detail(id),
    queryFn: () => dunningRulesApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useAllDunningRules(enabled = true) {
  return useQuery({
    queryKey: [...dunningRuleKeys.all, "all"],
    queryFn: () => dunningRulesApi.listAll(),
    enabled,
  });
}

export function usePaymentReminders(invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: ["payment-reminders", invoiceId],
    queryFn: () => paymentRemindersApi.listForInvoice(invoiceId),
    enabled: enabled && Boolean(invoiceId),
  });
}
