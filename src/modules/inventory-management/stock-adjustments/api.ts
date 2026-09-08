import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  StockAdjustmentCreateRequestSchema,
  StockAdjustmentListSchema,
  StockAdjustmentSchema,
  StockAdjustmentUpdateRequestSchema,
  type StockAdjustment,
  type StockAdjustmentCreateRequest,
  type StockAdjustmentListParams,
  type StockAdjustmentUpdateRequest,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type StockAdjustmentWriteOptions = {
  version: number;
};

export const stockAdjustmentsApi = {
  list: async (
    params: StockAdjustmentListParams = {},
  ): Promise<ListResponse<StockAdjustment[]>> => {
    const result = await apiClient.getList<unknown>("/stock-adjustments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        warehouse_id: params.warehouse_id,
        reason: params.reason,
        branch_id: params.branch_id,
        product_id: params.product_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: StockAdjustmentListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(await apiClient.get(`/stock-adjustments/${id}`)),
  create: async (values: StockAdjustmentCreateRequest): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(
      await apiClient.post("/stock-adjustments", StockAdjustmentCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: StockAdjustmentUpdateRequest,
    options: StockAdjustmentWriteOptions,
  ): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(
      await apiClient.patch(
        `/stock-adjustments/${id}`,
        StockAdjustmentUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: StockAdjustmentWriteOptions): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(
      await apiClient.post(`/stock-adjustments/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: StockAdjustmentWriteOptions & { reason?: string | null },
  ): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(
      await apiClient.post(
        `/stock-adjustments/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  clone: async (id: string): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(await apiClient.post(`/stock-adjustments/${id}/clone`)),
  delete: async (id: string, options: StockAdjustmentWriteOptions): Promise<StockAdjustment> =>
    StockAdjustmentSchema.parse(
      await apiClient.delete(`/stock-adjustments/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
