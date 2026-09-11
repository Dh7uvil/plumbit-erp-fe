import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  PurchaseInvoiceCreateFromGoodsReceiptSchema,
  PurchaseInvoiceCreateFromPurchaseOrderSchema,
  PurchaseInvoiceCreateRequestSchema,
  PurchaseInvoiceListSchema,
  PurchaseInvoiceSchema,
  PurchaseInvoiceUpdateRequestSchema,
  type PurchaseInvoice,
  type PurchaseInvoiceCreateFromGoodsReceipt,
  type PurchaseInvoiceCreateFromPurchaseOrder,
  type PurchaseInvoiceCreateRequest,
  type PurchaseInvoiceListParams,
  type PurchaseInvoiceUpdateRequest,
} from "@/modules/erp/purchase-invoices/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import type { PaymentAllocationInput } from "@/shared/components/document/schemas";
import { randomUuid } from "@/shared/lib/uuid";

export type PurchaseInvoiceWriteOptions = { version: number };

export const purchaseInvoicesApi = {
  list: async (
    params: PurchaseInvoiceListParams = {},
  ): Promise<ListResponse<PurchaseInvoice[]>> => {
    const result = await apiClient.getList<unknown>("/purchase-invoices", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        supplier_id: params.supplier_id,
        purchase_order_id: params.purchase_order_id,
        goods_receipt_id: params.goods_receipt_id,
        bill_type: params.bill_type,
        payment_status: params.payment_status,
        invoice_date_from: params.invoice_date_from,
        invoice_date_to: params.invoice_date_to,
      },
    });
    return { data: PurchaseInvoiceListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(await apiClient.get(`/purchase-invoices/${id}`)),
  create: async (values: PurchaseInvoiceCreateRequest): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post("/purchase-invoices", PurchaseInvoiceCreateRequestSchema.parse(values)),
    ),
  createFromPurchaseOrder: async (
    values: PurchaseInvoiceCreateFromPurchaseOrder,
  ): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post(
        "/purchase-invoices/from-purchase-order",
        PurchaseInvoiceCreateFromPurchaseOrderSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  createFromGoodsReceipt: async (
    values: PurchaseInvoiceCreateFromGoodsReceipt,
  ): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post(
        "/purchase-invoices/from-goods-receipt",
        PurchaseInvoiceCreateFromGoodsReceiptSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: PurchaseInvoiceUpdateRequest,
    options: PurchaseInvoiceWriteOptions,
  ): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.patch(
        `/purchase-invoices/${id}`,
        PurchaseInvoiceUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: PurchaseInvoiceWriteOptions): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post(`/purchase-invoices/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: PurchaseInvoiceWriteOptions & { reason?: string | null },
  ): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post(
        `/purchase-invoices/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: PurchaseInvoiceWriteOptions): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.delete(`/purchase-invoices/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/purchase-invoices/${id}/journal`)),
  applyDebits: async (
    id: string,
    options: PurchaseInvoiceWriteOptions & { allocations?: PaymentAllocationInput[] | null },
  ): Promise<PurchaseInvoice> =>
    PurchaseInvoiceSchema.parse(
      await apiClient.post(
        `/purchase-invoices/${id}/apply-debits`,
        { allocations: options.allocations ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
};
