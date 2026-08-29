import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PaymentTermCreateRequestSchema,
  PaymentTermListSchema,
  PaymentTermSchema,
  PaymentTermUpdateRequestSchema,
  type PaymentTerm,
  type PaymentTermCreateRequest,
  type PaymentTermListParams,
  type PaymentTermUpdateRequest,
} from "@/modules/erp/accounting/payment-terms/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const paymentTermsApi = {
  list: async (params: PaymentTermListParams = {}): Promise<ListResponse<PaymentTerm[]>> => {
    const result = await apiClient.getList<unknown>("/payment-terms", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: PaymentTermListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<PaymentTerm[]> =>
    fetchAllPages((page, pageSize) => paymentTermsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<PaymentTerm> =>
    PaymentTermSchema.parse(await apiClient.get(`/payment-terms/${id}`)),
  create: async (values: PaymentTermCreateRequest): Promise<PaymentTerm> =>
    PaymentTermSchema.parse(
      await apiClient.post("/payment-terms", PaymentTermCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: PaymentTermUpdateRequest): Promise<PaymentTerm> =>
    PaymentTermSchema.parse(
      await apiClient.patch(`/payment-terms/${id}`, PaymentTermUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<PaymentTerm> =>
    PaymentTermSchema.parse(await apiClient.delete(`/payment-terms/${id}`)),
};
