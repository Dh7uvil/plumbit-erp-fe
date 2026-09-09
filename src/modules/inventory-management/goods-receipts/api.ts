import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  GoodsReceiptCreateFromPurchaseOrderSchema,
  GoodsReceiptCreateRequestSchema,
  GoodsReceiptListSchema,
  GoodsReceiptSchema,
  GoodsReceiptUpdateRequestSchema,
  type GoodsReceipt,
  type GoodsReceiptCreateFromPurchaseOrder,
  type GoodsReceiptCreateRequest,
  type GoodsReceiptListParams,
  type GoodsReceiptUpdateRequest,
} from "@/modules/inventory-management/goods-receipts/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type GoodsReceiptWriteOptions = {
  version: number;
};

export const goodsReceiptsApi = {
  list: async (params: GoodsReceiptListParams = {}): Promise<ListResponse<GoodsReceipt[]>> => {
    const result = await apiClient.getList<unknown>("/goods-receipts", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        warehouse_id: params.warehouse_id,
        supplier_id: params.supplier_id,
        purchase_order_id: params.purchase_order_id,
        qc_status: params.qc_status,
        product_id: params.product_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: GoodsReceiptListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(await apiClient.get(`/goods-receipts/${id}`)),
  create: async (values: GoodsReceiptCreateRequest): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.post("/goods-receipts", GoodsReceiptCreateRequestSchema.parse(values)),
    ),
  createFromPurchaseOrder: async (
    values: GoodsReceiptCreateFromPurchaseOrder,
  ): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.post(
        "/goods-receipts/from-purchase-order",
        GoodsReceiptCreateFromPurchaseOrderSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: GoodsReceiptUpdateRequest,
    options: GoodsReceiptWriteOptions,
  ): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.patch(
        `/goods-receipts/${id}`,
        GoodsReceiptUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: GoodsReceiptWriteOptions): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.post(`/goods-receipts/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: GoodsReceiptWriteOptions & { reason?: string | null },
  ): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.post(
        `/goods-receipts/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: GoodsReceiptWriteOptions): Promise<GoodsReceipt> =>
    GoodsReceiptSchema.parse(
      await apiClient.delete(`/goods-receipts/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
