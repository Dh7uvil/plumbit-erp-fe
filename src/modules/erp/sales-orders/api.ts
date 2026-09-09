import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CustomerPoDuplicateListSchema,
  PurchaseOrderFromSalesOrderRequestSchema,
  PurchaseOrderPlanSchema,
  SalesOrderComposeDefaultsSchema,
  SalesOrderCoverageSchema,
  SalesOrderCreateRequestSchema,
  SalesOrderListSchema,
  SalesOrderSchema,
  SalesOrderUpdateRequestSchema,
  type CustomerPoDuplicate,
  type PurchaseOrderFromSalesOrderRequest,
  type PurchaseOrderPlan,
  type SalesOrder,
  type SalesOrderComposeDefaults,
  type SalesOrderCoverage,
  type SalesOrderCreateRequest,
  type SalesOrderListParams,
  type SalesOrderUpdateRequest,
} from "@/modules/erp/sales-orders/schemas";
import { PurchaseOrderListSchema, type PurchaseOrder } from "@/modules/erp/purchase-orders/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type SalesOrderWriteOptions = {
  version: number;
};

export const salesOrdersApi = {
  composeDefaults: async (customerId: string): Promise<SalesOrderComposeDefaults> =>
    SalesOrderComposeDefaultsSchema.parse(
      await apiClient.get("/sales-orders/compose-defaults", {
        params: { customer_id: customerId },
      }),
    ),
  list: async (params: SalesOrderListParams = {}): Promise<ListResponse<SalesOrder[]>> => {
    const result = await apiClient.getList<unknown>("/sales-orders", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        fulfillment_status: params.fulfillment_status,
        billing_status: params.billing_status,
        customer_id: params.customer_id,
        branch_id: params.branch_id,
        warehouse_id: params.warehouse_id,
        currency_id: params.currency_id,
        salesperson_id: params.salesperson_id,
        source_quotation_id: params.source_quotation_id,
        source_proforma_invoice_id: params.source_proforma_invoice_id,
      },
    });
    return { data: SalesOrderListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<SalesOrder> =>
    SalesOrderSchema.parse(await apiClient.get(`/sales-orders/${id}`)),
  create: async (values: SalesOrderCreateRequest): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post("/sales-orders", SalesOrderCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: SalesOrderUpdateRequest,
    options: SalesOrderWriteOptions,
  ): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.patch(
        `/sales-orders/${id}`,
        SalesOrderUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  submit: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/submit`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  approve: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/approve`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  reject: async (
    id: string,
    options: SalesOrderWriteOptions & { reason?: string | null },
  ): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(
        `/sales-orders/${id}/reject`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reopen: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/reopen`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  confirm: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/confirm`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  close: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/close`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: SalesOrderWriteOptions & { reason?: string | null },
  ): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(
        `/sales-orders/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  clone: async (id: string): Promise<SalesOrder> =>
    SalesOrderSchema.parse(await apiClient.post(`/sales-orders/${id}/clone`)),
  acknowledge: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(`/sales-orders/${id}/acknowledge`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  checkCustomerPo: async (params: {
    customer_id: string;
    customer_po_number: string;
    exclude_id?: string;
  }): Promise<CustomerPoDuplicate[]> =>
    CustomerPoDuplicateListSchema.parse(
      await apiClient.get("/sales-orders/check-customer-po", {
        params: {
          customer_id: params.customer_id,
          customer_po_number: params.customer_po_number,
          exclude_id: params.exclude_id,
        },
      }),
    ),
  getPurchaseOrderPlan: async (id: string): Promise<PurchaseOrderPlan> =>
    PurchaseOrderPlanSchema.parse(await apiClient.get(`/sales-orders/${id}/purchase-order-plan`)),
  getCoverage: async (id: string): Promise<SalesOrderCoverage> =>
    SalesOrderCoverageSchema.parse(await apiClient.get(`/sales-orders/${id}/coverage`)),
  createPurchaseOrders: async (
    id: string,
    values: PurchaseOrderFromSalesOrderRequest,
  ): Promise<PurchaseOrder[]> =>
    PurchaseOrderListSchema.parse(
      await apiClient.post(
        `/sales-orders/${id}/purchase-orders`,
        PurchaseOrderFromSalesOrderRequestSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  delete: async (id: string, options: SalesOrderWriteOptions): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.delete(`/sales-orders/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
