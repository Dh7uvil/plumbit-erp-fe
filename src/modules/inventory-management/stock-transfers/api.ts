import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  StockTransferCreateRequestSchema,
  StockTransferListSchema,
  StockTransferSchema,
  StockTransferUpdateRequestSchema,
  type StockTransfer,
  type StockTransferCreateRequest,
  type StockTransferListParams,
  type StockTransferUpdateRequest,
} from "@/modules/inventory-management/stock-transfers/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type StockTransferWriteOptions = {
  version: number;
};

export const stockTransfersApi = {
  list: async (params: StockTransferListParams = {}): Promise<ListResponse<StockTransfer[]>> => {
    const result = await apiClient.getList<unknown>("/stock-transfers", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        from_warehouse_id: params.from_warehouse_id,
        to_warehouse_id: params.to_warehouse_id,
        branch_id: params.branch_id,
        product_id: params.product_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: StockTransferListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<StockTransfer> =>
    StockTransferSchema.parse(await apiClient.get(`/stock-transfers/${id}`)),
  create: async (values: StockTransferCreateRequest): Promise<StockTransfer> =>
    StockTransferSchema.parse(
      await apiClient.post("/stock-transfers", StockTransferCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: StockTransferUpdateRequest,
    options: StockTransferWriteOptions,
  ): Promise<StockTransfer> =>
    StockTransferSchema.parse(
      await apiClient.patch(
        `/stock-transfers/${id}`,
        StockTransferUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: StockTransferWriteOptions): Promise<StockTransfer> =>
    StockTransferSchema.parse(
      await apiClient.post(`/stock-transfers/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: StockTransferWriteOptions & { reason?: string | null },
  ): Promise<StockTransfer> =>
    StockTransferSchema.parse(
      await apiClient.post(
        `/stock-transfers/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  clone: async (id: string): Promise<StockTransfer> =>
    StockTransferSchema.parse(await apiClient.post(`/stock-transfers/${id}/clone`)),
  delete: async (id: string, options: StockTransferWriteOptions): Promise<StockTransfer> =>
    StockTransferSchema.parse(
      await apiClient.delete(`/stock-transfers/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
