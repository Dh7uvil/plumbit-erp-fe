import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  BankAccountCreateRequestSchema,
  BankAccountListSchema,
  BankAccountSchema,
  BankAccountUpdateRequestSchema,
  type BankAccount,
  type BankAccountCreateRequest,
  type BankAccountListParams,
  type BankAccountUpdateRequest,
} from "@/modules/erp/accounting/bank-accounts/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const bankAccountsApi = {
  list: async (params: BankAccountListParams = {}): Promise<ListResponse<BankAccount[]>> => {
    const result = await apiClient.getList<unknown>("/bank-accounts", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
        currency_id: params.currency_id,
      },
    });
    return { data: BankAccountListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<BankAccount[]> =>
    fetchAllPages((page, pageSize) => bankAccountsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<BankAccount> =>
    BankAccountSchema.parse(await apiClient.get(`/bank-accounts/${id}`)),
  create: async (values: BankAccountCreateRequest): Promise<BankAccount> =>
    BankAccountSchema.parse(
      await apiClient.post("/bank-accounts", BankAccountCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: BankAccountUpdateRequest): Promise<BankAccount> =>
    BankAccountSchema.parse(
      await apiClient.patch(`/bank-accounts/${id}`, BankAccountUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<BankAccount> =>
    BankAccountSchema.parse(await apiClient.delete(`/bank-accounts/${id}`)),
};
