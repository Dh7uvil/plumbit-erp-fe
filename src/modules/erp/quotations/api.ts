import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  QuotationComposeDefaultsSchema,
  QuotationCreateRequestSchema,
  QuotationListSchema,
  QuotationSchema,
  QuotationUpdateRequestSchema,
  type Quotation,
  type QuotationComposeDefaults,
  type QuotationCreateRequest,
  type QuotationListParams,
  type QuotationUpdateRequest,
} from "@/modules/erp/quotations/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const quotationsApi = {
  composeDefaults: async (customerId: string): Promise<QuotationComposeDefaults> =>
    QuotationComposeDefaultsSchema.parse(
      await apiClient.get("/quotations/compose-defaults", {
        params: { customer_id: customerId },
      }),
    ),
  list: async (params: QuotationListParams = {}): Promise<ListResponse<Quotation[]>> => {
    const result = await apiClient.getList<unknown>("/quotations", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        branch_id: params.branch_id,
        currency_id: params.currency_id,
      },
    });
    return { data: QuotationListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.get(`/quotations/${id}`)),
  create: async (values: QuotationCreateRequest): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post("/quotations", QuotationCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: QuotationUpdateRequest): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.patch(`/quotations/${id}`, QuotationUpdateRequestSchema.parse(values)),
    ),
  submit: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/submit`)),
  approve: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/approve`)),
  reject: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/reject`)),
  reopen: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/reopen`)),
  send: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/send`)),
  accept: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/accept`)),
  decline: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/decline`)),
  cancel: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/cancel`)),
  clone: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/clone`)),
};
