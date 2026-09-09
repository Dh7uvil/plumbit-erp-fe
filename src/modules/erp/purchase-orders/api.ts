import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PurchaseOrderComposeDefaultsSchema,
  PurchaseOrderCreateRequestSchema,
  PurchaseOrderListSchema,
  PurchaseOrderSchema,
  PurchaseOrderUpdateRequestSchema,
  type PurchaseOrder,
  type PurchaseOrderComposeDefaults,
  type PurchaseOrderCreateRequest,
  type PurchaseOrderListParams,
  type PurchaseOrderUpdateRequest,
} from "@/modules/erp/purchase-orders/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type PurchaseOrderWriteOptions = {
  version: number;
};

export const purchaseOrdersApi = {
  composeDefaults: async (supplierId: string): Promise<PurchaseOrderComposeDefaults> =>
    PurchaseOrderComposeDefaultsSchema.parse(
      await apiClient.get("/purchase-orders/compose-defaults", {
        params: { supplier_id: supplierId },
      }),
    ),
  list: async (params: PurchaseOrderListParams = {}): Promise<ListResponse<PurchaseOrder[]>> => {
    const result = await apiClient.getList<unknown>("/purchase-orders", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        receipt_status: params.receipt_status,
        billing_status: params.billing_status,
        supplier_id: params.supplier_id,
        branch_id: params.branch_id,
        warehouse_id: params.warehouse_id,
        currency_id: params.currency_id,
        source_sales_order_id: params.source_sales_order_id,
      },
    });
    return { data: PurchaseOrderListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(await apiClient.get(`/purchase-orders/${id}`)),
  create: async (values: PurchaseOrderCreateRequest): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post("/purchase-orders", PurchaseOrderCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: PurchaseOrderUpdateRequest,
    options: PurchaseOrderWriteOptions,
  ): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.patch(
        `/purchase-orders/${id}`,
        PurchaseOrderUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  submit: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(`/purchase-orders/${id}/submit`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  approve: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(`/purchase-orders/${id}/approve`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  reject: async (
    id: string,
    options: PurchaseOrderWriteOptions & { reason?: string | null },
  ): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(
        `/purchase-orders/${id}/reject`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reopen: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(`/purchase-orders/${id}/reopen`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  issue: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(`/purchase-orders/${id}/issue`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  close: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(`/purchase-orders/${id}/close`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: PurchaseOrderWriteOptions & { reason?: string | null },
  ): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.post(
        `/purchase-orders/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  clone: async (id: string): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(await apiClient.post(`/purchase-orders/${id}/clone`)),
  delete: async (id: string, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder> =>
    PurchaseOrderSchema.parse(
      await apiClient.delete(`/purchase-orders/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
