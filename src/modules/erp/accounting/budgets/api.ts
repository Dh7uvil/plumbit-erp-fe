import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  BudgetCreateRequestSchema,
  BudgetListSchema,
  BudgetSchema,
  BudgetVsActualSchema,
  type Budget,
  type BudgetCreateRequest,
  type BudgetListParams,
  type BudgetVsActual,
} from "@/modules/erp/accounting/budgets/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export const budgetsApi = {
  list: async (params: BudgetListParams = {}): Promise<ListResponse<Budget[]>> => {
    const result = await apiClient.getList<unknown>("/budgets", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        status: params.status,
        fiscal_year: params.fiscal_year,
      },
    });
    return { data: BudgetListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Budget> =>
    BudgetSchema.parse(await apiClient.get(`/budgets/${id}`)),
  create: async (values: BudgetCreateRequest): Promise<Budget> =>
    BudgetSchema.parse(await apiClient.post("/budgets", BudgetCreateRequestSchema.parse(values))),
  activate: async (id: string, version: number): Promise<Budget> =>
    BudgetSchema.parse(
      await apiClient.post(`/budgets/${id}/activate`, {}, { headers: ifMatchHeaders(version) }),
    ),
  close: async (id: string, version: number): Promise<Budget> =>
    BudgetSchema.parse(
      await apiClient.post(`/budgets/${id}/close`, {}, { headers: ifMatchHeaders(version) }),
    ),
  vsActual: async (id: string, from: string, to: string): Promise<BudgetVsActual> =>
    BudgetVsActualSchema.parse(
      await apiClient.get(`/budgets/${id}/vs-actual`, { params: { from, to } }),
    ),
};
