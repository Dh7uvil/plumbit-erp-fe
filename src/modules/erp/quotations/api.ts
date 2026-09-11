import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ConvertToProformaInvoiceRequestSchema,
  ConvertToSalesInvoiceRequestSchema,
  ConvertToSalesOrderRequestSchema,
  QuotationComposeDefaultsSchema,
  QuotationCreateRequestSchema,
  QuotationListSchema,
  QuotationRevisionListSchema,
  QuotationRevisionSchema,
  QuotationSchema,
  QuotationUpdateRequestSchema,
  ReviseQuotationRequestSchema,
  type ConvertToProformaInvoiceRequest,
  type ConvertToSalesInvoiceRequest,
  type ConvertToSalesOrderRequest,
  type Quotation,
  type QuotationComposeDefaults,
  type QuotationCreateRequest,
  type QuotationListParams,
  type QuotationRevision,
  type QuotationRevisionListItem,
  type QuotationUpdateRequest,
} from "@/modules/erp/quotations/schemas";
import { ProformaInvoiceSchema, type ProformaInvoice } from "@/modules/erp/proforma-invoices/schemas";
import { SalesInvoiceSchema, type SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { SalesOrderSchema, type SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type QuotationWriteOptions = {
  version: number;
};

export const quotationsApi = {
  composeDefaults: async (customerId: string): Promise<QuotationComposeDefaults> =>
    QuotationComposeDefaultsSchema.parse(
      await apiClient.get("/quotations/compose-defaults", {
        params: { customer_id: customerId },
      }),
    ),
  list: async (params: QuotationListParams = {}): Promise<ListResponse<Quotation[]>> => {
    const result = await apiClient.getList<unknown>("/quotations", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        branch_id: params.branch_id,
        currency_id: params.currency_id,
      },
    });
    return { data: QuotationListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.get(`/quotations/${id}`)),
  create: async (values: QuotationCreateRequest): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post("/quotations", QuotationCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: QuotationUpdateRequest,
    options: QuotationWriteOptions,
  ): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.patch(
        `/quotations/${id}`,
        QuotationUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  submit: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/submit`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  approve: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/approve`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  reject: async (
    id: string,
    options: QuotationWriteOptions & { reason?: string | null },
  ): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(
        `/quotations/${id}/reject`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reopen: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/reopen`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  send: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/send`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  accept: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/accept`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  decline: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/decline`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  cancel: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(`/quotations/${id}/cancel`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  clone: async (id: string): Promise<Quotation> =>
    QuotationSchema.parse(await apiClient.post(`/quotations/${id}/clone`)),
  convertToSalesOrder: async (
    id: string,
    options: QuotationWriteOptions & { values?: ConvertToSalesOrderRequest },
  ): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(
        `/quotations/${id}/convert-to-sales-order`,
        ConvertToSalesOrderRequestSchema.parse({
          ...(options.values ?? {}),
          version: options.version,
        }),
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  convertToProformaInvoice: async (
    id: string,
    options: QuotationWriteOptions & { values?: ConvertToProformaInvoiceRequest },
  ): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(
        `/quotations/${id}/convert-to-proforma-invoice`,
        ConvertToProformaInvoiceRequestSchema.parse({
          ...(options.values ?? {}),
          version: options.version,
        }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  convertToSalesInvoice: async (
    id: string,
    options: QuotationWriteOptions & { values?: ConvertToSalesInvoiceRequest },
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        `/quotations/${id}/convert-to-sales-invoice`,
        ConvertToSalesInvoiceRequestSchema.parse({
          ...(options.values ?? {}),
          version: options.version,
        }),
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  revise: async (
    id: string,
    options: QuotationWriteOptions & { revision_reason: string },
  ): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.post(
        `/quotations/${id}/revise`,
        ReviseQuotationRequestSchema.parse({
          revision_reason: options.revision_reason,
          version: options.version,
        }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  listRevisions: async (id: string): Promise<QuotationRevisionListItem[]> =>
    QuotationRevisionListSchema.parse(await apiClient.get(`/quotations/${id}/revisions`)),
  getRevision: async (id: string, revisionNumber: number): Promise<QuotationRevision> =>
    QuotationRevisionSchema.parse(
      await apiClient.get(`/quotations/${id}/revisions/${revisionNumber}`),
    ),
  delete: async (id: string, options: QuotationWriteOptions): Promise<Quotation> =>
    QuotationSchema.parse(
      await apiClient.delete(`/quotations/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
