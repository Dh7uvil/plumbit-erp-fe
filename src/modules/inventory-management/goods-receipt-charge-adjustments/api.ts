import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  GrnChargeAdjustmentCreateRequestSchema,
  GrnChargeAdjustmentListSchema,
  GrnChargeAdjustmentSchema,
  GrnChargeAdjustmentUpdateRequestSchema,
  type GrnChargeAdjustment,
  type GrnChargeAdjustmentCreateRequest,
  type GrnChargeAdjustmentListParams,
  type GrnChargeAdjustmentUpdateRequest,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type GrnChargeAdjustmentWriteOptions = {
  version: number;
};

export const grnChargeAdjustmentsApi = {
  list: async (
    params: GrnChargeAdjustmentListParams = {},
  ): Promise<ListResponse<GrnChargeAdjustment[]>> => {
    const result = await apiClient.getList<unknown>("/goods-receipt-charge-adjustments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        goods_receipt_id: params.goods_receipt_id,
        branch_id: params.branch_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: GrnChargeAdjustmentListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<GrnChargeAdjustment> =>
    GrnChargeAdjustmentSchema.parse(
      await apiClient.get(`/goods-receipt-charge-adjustments/${id}`),
    ),
  create: async (values: GrnChargeAdjustmentCreateRequest): Promise<GrnChargeAdjustment> =>
    GrnChargeAdjustmentSchema.parse(
      await apiClient.post(
        "/goods-receipt-charge-adjustments",
        GrnChargeAdjustmentCreateRequestSchema.parse(values),
      ),
    ),
  update: async (
    id: string,
    values: GrnChargeAdjustmentUpdateRequest,
    options: GrnChargeAdjustmentWriteOptions,
  ): Promise<GrnChargeAdjustment> =>
    GrnChargeAdjustmentSchema.parse(
      await apiClient.patch(
        `/goods-receipt-charge-adjustments/${id}`,
        GrnChargeAdjustmentUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: GrnChargeAdjustmentWriteOptions): Promise<GrnChargeAdjustment> =>
    GrnChargeAdjustmentSchema.parse(
      await apiClient.post(`/goods-receipt-charge-adjustments/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  delete: async (id: string, options: GrnChargeAdjustmentWriteOptions): Promise<GrnChargeAdjustment> =>
    GrnChargeAdjustmentSchema.parse(
      await apiClient.delete(`/goods-receipt-charge-adjustments/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
