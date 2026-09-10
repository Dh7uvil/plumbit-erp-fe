import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  SalesReturnCreateRequestSchema,
  SalesReturnListSchema,
  SalesReturnSchema,
  SalesReturnUpdateRequestSchema,
  type SalesReturn,
  type SalesReturnCreateRequest,
  type SalesReturnListParams,
  type SalesReturnUpdateRequest,
} from "@/modules/inventory-management/sales-returns/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type SalesReturnWriteOptions = { version: number };

export const salesReturnsApi = {
  list: async (params: SalesReturnListParams = {}): Promise<ListResponse<SalesReturn[]>> => {
    const result = await apiClient.getList<unknown>("/sales-returns", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        delivery_note_id: params.delivery_note_id,
        sales_order_id: params.sales_order_id,
        customer_id: params.customer_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: SalesReturnListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<SalesReturn> =>
    SalesReturnSchema.parse(await apiClient.get(`/sales-returns/${id}`)),
  create: async (values: SalesReturnCreateRequest): Promise<SalesReturn> =>
    SalesReturnSchema.parse(
      await apiClient.post("/sales-returns", SalesReturnCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: SalesReturnUpdateRequest,
    options: SalesReturnWriteOptions,
  ): Promise<SalesReturn> =>
    SalesReturnSchema.parse(
      await apiClient.patch(
        `/sales-returns/${id}`,
        SalesReturnUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: SalesReturnWriteOptions): Promise<SalesReturn> =>
    SalesReturnSchema.parse(
      await apiClient.post(`/sales-returns/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: SalesReturnWriteOptions & { reason?: string | null },
  ): Promise<SalesReturn> =>
    SalesReturnSchema.parse(
      await apiClient.post(
        `/sales-returns/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: SalesReturnWriteOptions): Promise<SalesReturn> =>
    SalesReturnSchema.parse(
      await apiClient.delete(`/sales-returns/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
