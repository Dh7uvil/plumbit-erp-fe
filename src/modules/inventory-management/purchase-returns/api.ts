import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PurchaseReturnCreateRequestSchema,
  PurchaseReturnListSchema,
  PurchaseReturnSchema,
  PurchaseReturnUpdateRequestSchema,
  type PurchaseReturn,
  type PurchaseReturnCreateRequest,
  type PurchaseReturnListParams,
  type PurchaseReturnUpdateRequest,
} from "@/modules/inventory-management/purchase-returns/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type PurchaseReturnWriteOptions = { version: number };

export const purchaseReturnsApi = {
  list: async (params: PurchaseReturnListParams = {}): Promise<ListResponse<PurchaseReturn[]>> => {
    const result = await apiClient.getList<unknown>("/purchase-returns", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        goods_receipt_id: params.goods_receipt_id,
        purchase_order_id: params.purchase_order_id,
        supplier_id: params.supplier_id,
        warehouse_id: params.warehouse_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: PurchaseReturnListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(await apiClient.get(`/purchase-returns/${id}`)),
  create: async (values: PurchaseReturnCreateRequest): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(
      await apiClient.post("/purchase-returns", PurchaseReturnCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: PurchaseReturnUpdateRequest,
    options: PurchaseReturnWriteOptions,
  ): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(
      await apiClient.patch(
        `/purchase-returns/${id}`,
        PurchaseReturnUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: PurchaseReturnWriteOptions): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(
      await apiClient.post(`/purchase-returns/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: PurchaseReturnWriteOptions & { reason?: string | null },
  ): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(
      await apiClient.post(
        `/purchase-returns/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: PurchaseReturnWriteOptions): Promise<PurchaseReturn> =>
    PurchaseReturnSchema.parse(
      await apiClient.delete(`/purchase-returns/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
