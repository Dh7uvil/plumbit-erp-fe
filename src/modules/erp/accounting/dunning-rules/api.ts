import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  DunningRuleCreateRequestSchema,
  DunningRuleListSchema,
  DunningRuleSchema,
  DunningRuleUpdateRequestSchema,
  PaymentReminderLogListSchema,
  SendPaymentReminderResponseSchema,
  type DunningRule,
  type DunningRuleCreateRequest,
  type DunningRuleListParams,
  type DunningRuleUpdateRequest,
  type PaymentReminderLog,
} from "@/modules/erp/accounting/dunning-rules/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const dunningRulesApi = {
  list: async (params: DunningRuleListParams = {}): Promise<ListResponse<DunningRule[]>> => {
    const result = await apiClient.getList<unknown>("/dunning-rules", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: DunningRuleListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<DunningRule[]> =>
    fetchAllPages((page, pageSize) => dunningRulesApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<DunningRule> =>
    DunningRuleSchema.parse(await apiClient.get(`/dunning-rules/${id}`)),
  create: async (values: DunningRuleCreateRequest): Promise<DunningRule> =>
    DunningRuleSchema.parse(
      await apiClient.post("/dunning-rules", DunningRuleCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: DunningRuleUpdateRequest): Promise<DunningRule> =>
    DunningRuleSchema.parse(
      await apiClient.patch(`/dunning-rules/${id}`, DunningRuleUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<DunningRule> =>
    DunningRuleSchema.parse(await apiClient.delete(`/dunning-rules/${id}`)),
};

export const paymentRemindersApi = {
  listForInvoice: async (invoiceId: string): Promise<PaymentReminderLog[]> =>
    PaymentReminderLogListSchema.parse(
      await apiClient.get(`/sales-invoices/${invoiceId}/payment-reminders`),
    ),
  send: async (invoiceId: string, dunningRuleId?: string) =>
    SendPaymentReminderResponseSchema.parse(
      await apiClient.post(`/sales-invoices/${invoiceId}/send-reminder`, {
        dunning_rule_id: dunningRuleId ?? null,
      }),
    ),
};
