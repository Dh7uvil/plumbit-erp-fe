import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ConvertProformaToSalesInvoiceRequestSchema,
  ConvertProformaToSalesOrderRequestSchema,
  ProformaInvoiceComposeDefaultsSchema,
  ProformaInvoiceCreateRequestSchema,
  ProformaInvoiceListSchema,
  ProformaInvoiceSchema,
  ProformaInvoiceUpdateRequestSchema,
  type ConvertProformaToSalesInvoiceRequest,
  type ConvertProformaToSalesOrderRequest,
  type ProformaInvoice,
  type ProformaInvoiceComposeDefaults,
  type ProformaInvoiceCreateRequest,
  type ProformaInvoiceListParams,
  type ProformaInvoiceUpdateRequest,
} from "@/modules/erp/proforma-invoices/schemas";
import { SalesInvoiceSchema, type SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { SalesOrderSchema, type SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type ProformaInvoiceWriteOptions = {
  version: number;
};

export const proformaInvoicesApi = {
  composeDefaults: async (customerId: string): Promise<ProformaInvoiceComposeDefaults> =>
    ProformaInvoiceComposeDefaultsSchema.parse(
      await apiClient.get("/proforma-invoices/compose-defaults", {
        params: { customer_id: customerId },
      }),
    ),
  list: async (
    params: ProformaInvoiceListParams = {},
  ): Promise<ListResponse<ProformaInvoice[]>> => {
    const result = await apiClient.getList<unknown>("/proforma-invoices", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        source_quotation_id: params.source_quotation_id,
        branch_id: params.branch_id,
        currency_id: params.currency_id,
      },
    });
    return { data: ProformaInvoiceListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(await apiClient.get(`/proforma-invoices/${id}`)),
  create: async (values: ProformaInvoiceCreateRequest): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post("/proforma-invoices", ProformaInvoiceCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: ProformaInvoiceUpdateRequest,
    options: ProformaInvoiceWriteOptions,
  ): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.patch(
        `/proforma-invoices/${id}`,
        ProformaInvoiceUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  send: async (id: string, options: ProformaInvoiceWriteOptions): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(`/proforma-invoices/${id}/send`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  confirm: async (id: string, options: ProformaInvoiceWriteOptions): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(`/proforma-invoices/${id}/confirm`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  decline: async (
    id: string,
    options: ProformaInvoiceWriteOptions & { reason?: string | null },
  ): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(
        `/proforma-invoices/${id}/decline`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  cancel: async (
    id: string,
    options: ProformaInvoiceWriteOptions & { reason?: string | null },
  ): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(
        `/proforma-invoices/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reopen: async (id: string, options: ProformaInvoiceWriteOptions): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(`/proforma-invoices/${id}/reopen`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  revise: async (id: string, options: ProformaInvoiceWriteOptions): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.post(`/proforma-invoices/${id}/revise`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  clone: async (id: string): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(await apiClient.post(`/proforma-invoices/${id}/clone`)),
  convertToSalesOrder: async (
    id: string,
    options: ProformaInvoiceWriteOptions & { values?: ConvertProformaToSalesOrderRequest },
  ): Promise<SalesOrder> =>
    SalesOrderSchema.parse(
      await apiClient.post(
        `/proforma-invoices/${id}/convert-to-sales-order`,
        ConvertProformaToSalesOrderRequestSchema.parse({
          ...(options.values ?? {}),
          version: options.version,
        }),
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  convertToSalesInvoice: async (
    id: string,
    options: ProformaInvoiceWriteOptions & { values?: ConvertProformaToSalesInvoiceRequest },
  ): Promise<SalesInvoice> =>
    SalesInvoiceSchema.parse(
      await apiClient.post(
        `/proforma-invoices/${id}/convert-to-sales-invoice`,
        ConvertProformaToSalesInvoiceRequestSchema.parse({
          ...(options.values ?? {}),
          version: options.version,
        }),
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: ProformaInvoiceWriteOptions): Promise<ProformaInvoice> =>
    ProformaInvoiceSchema.parse(
      await apiClient.delete(`/proforma-invoices/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
