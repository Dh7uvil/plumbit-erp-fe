import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  RecurringTemplateListSchema,
  RecurringTemplateSchema,
  type RecurringListParams,
  type RecurringTemplate,
} from "@/modules/erp/accounting/recurring/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const recurringApi = {
  list: async (params: RecurringListParams = {}): Promise<ListResponse<RecurringTemplate[]>> => {
    const result = await apiClient.getList<unknown>("/recurring-templates", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        status: params.status,
      },
    });
    return { data: RecurringTemplateListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<RecurringTemplate> =>
    RecurringTemplateSchema.parse(await apiClient.get(`/recurring-templates/${id}`)),
  create: async (values: {
    name: string;
    document_kind: "SALES_INVOICE" | "PURCHASE_INVOICE";
    frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    next_run_date: string;
    template_payload: Record<string, unknown>;
  }): Promise<RecurringTemplate> =>
    RecurringTemplateSchema.parse(await apiClient.post("/recurring-templates", values)),
  generate: async (id: string): Promise<RecurringTemplate> =>
    RecurringTemplateSchema.parse(await apiClient.post(`/recurring-templates/${id}/generate`, {})),
};
