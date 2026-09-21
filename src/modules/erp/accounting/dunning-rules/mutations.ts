import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dunningRulesApi, paymentRemindersApi } from "@/modules/erp/accounting/dunning-rules/api";
import { dunningRuleKeys } from "@/modules/erp/accounting/dunning-rules/queries";
import type {
  DunningRuleCreateRequest,
  DunningRuleUpdateRequest,
} from "@/modules/erp/accounting/dunning-rules/schemas";
import { salesInvoiceKeys } from "@/modules/erp/sales-invoices/queries";

export function useCreateDunningRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DunningRuleCreateRequest) => dunningRulesApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dunningRuleKeys.all });
    },
  });
}

export function useUpdateDunningRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DunningRuleUpdateRequest }) =>
      dunningRulesApi.update(id, values),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: dunningRuleKeys.all });
      void queryClient.invalidateQueries({ queryKey: dunningRuleKeys.detail(id) });
    },
  });
}

export function useDeleteDunningRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dunningRulesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dunningRuleKeys.all });
    },
  });
}

export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, dunningRuleId }: { invoiceId: string; dunningRuleId?: string }) =>
      paymentRemindersApi.send(invoiceId, dunningRuleId),
    onSuccess: (_data, { invoiceId }) => {
      void queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.detail(invoiceId) });
      void queryClient.invalidateQueries({ queryKey: ["payment-reminders", invoiceId] });
    },
  });
}
