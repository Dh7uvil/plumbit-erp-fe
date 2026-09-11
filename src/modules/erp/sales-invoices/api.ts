import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  SalesInvoiceCreateFromDeliveryNotesSchema,
  SalesInvoiceCreateFromSalesOrderSchema,
  SalesInvoiceCreateRequestSchema,
  SalesInvoiceListSchema,
  SalesInvoiceMarginSchema,
  SalesInvoiceSchema,
  SalesInvoiceUpdateRequestSchema,
  type SalesInvoice,
  type SalesInvoiceCreateFromDeliveryNotes,
  type SalesInvoiceCreateFromSalesOrder,
  type SalesInvoiceCreateRequest,
  type SalesInvoiceListParams,
  type SalesInvoiceMargin,
  type SalesInvoiceUpdateRequest,
} from "@/modules/erp/sales-invoices/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import type { PaymentAllocationInput } from "@/shared/components/document/schemas";
import { randomUuid } from "@/shared/lib/uuid";

export type SalesInvoiceWriteOptions = {
  version: number;
  creditOverride?: string | null;
};

export const salesInvoicesApi = {
  list: async (params: SalesInvoiceListParams = {}): Promise<ListResponse<SalesInvoice[]>> => {
    const result = await apiClient.getList<unknown>("/sales-invoices", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        sales_order_id: params.sales_order_id,
        branch_id: params.branch_id,
        currency_id: params.currency_id,
        payment_status: params.payment_status,
        invoice_date_from: params.invoice_date_from,
        invoice_date_to: params.invoice_date_to,
      },
    });
    return { data: SalesInvoiceListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(await apiClient.get(`/sales-invoices/${id}`)),
  create: async (values: SalesInvoiceCreateRequest): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post("/sales-invoices", SalesInvoiceCreateRequestSchema.parse(values)),
    ),
  createFromSalesOrder: async (
    values: SalesInvoiceCreateFromSalesOrder,
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        "/sales-invoices/from-sales-order",
        SalesInvoiceCreateFromSalesOrderSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  createFromDeliveryNotes: async (
    values: SalesInvoiceCreateFromDeliveryNotes,
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        "/sales-invoices/from-delivery-notes",
        SalesInvoiceCreateFromDeliveryNotesSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: SalesInvoiceUpdateRequest,
    options: SalesInvoiceWriteOptions,
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.patch(
        `/sales-invoices/${id}`,
        SalesInvoiceUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: SalesInvoiceWriteOptions): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(`/sales-invoices/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version, undefined, {
          creditOverride: options.creditOverride,
        }),
      }),
    ),
  applyCredits: async (
    id: string,
    options: SalesInvoiceWriteOptions & { allocations?: PaymentAllocationInput[] | null },
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        `/sales-invoices/${id}/apply-credits`,
        { allocations: options.allocations ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  cancel: async (
    id: string,
    options: SalesInvoiceWriteOptions & { reason?: string | null },
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        `/sales-invoices/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: SalesInvoiceWriteOptions): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.delete(`/sales-invoices/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/sales-invoices/${id}/journal`)),
  margin: async (id: string): Promise<SalesInvoiceMargin> =>
    SalesInvoiceMarginSchema.parse(await apiClient.get(`/sales-invoices/${id}/margin`)),
};
