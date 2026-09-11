import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  CustomerPaymentCreateRequestSchema,
  CustomerPaymentListSchema,
  CustomerPaymentSchema,
  CustomerPaymentUpdateRequestSchema,
  PaymentAllocateRequestSchema,
  type CustomerPayment,
  type CustomerPaymentCreateRequest,
  type CustomerPaymentListParams,
  type CustomerPaymentUpdateRequest,
  type PaymentAllocateRequest,
} from "@/modules/erp/customer-payments/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type CustomerPaymentWriteOptions = { version: number };

export const customerPaymentsApi = {
  list: async (
    params: CustomerPaymentListParams = {},
  ): Promise<ListResponse<CustomerPayment[]>> => {
    const result = await apiClient.getList<unknown>("/customer-payments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        proforma_invoice_id: params.proforma_invoice_id,
        sales_order_id: params.sales_order_id,
        currency_id: params.currency_id,
        payment_method: params.payment_method,
        payment_date_from: params.payment_date_from,
        payment_date_to: params.payment_date_to,
      },
    });
    return { data: CustomerPaymentListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(await apiClient.get(`/customer-payments/${id}`)),
  create: async (values: CustomerPaymentCreateRequest): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.post("/customer-payments", CustomerPaymentCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: CustomerPaymentUpdateRequest,
    options: CustomerPaymentWriteOptions,
  ): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.patch(
        `/customer-payments/${id}`,
        CustomerPaymentUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: CustomerPaymentWriteOptions): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.post(`/customer-payments/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  allocate: async (
    id: string,
    values: PaymentAllocateRequest,
    options: CustomerPaymentWriteOptions,
  ): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.post(
        `/customer-payments/${id}/allocate`,
        PaymentAllocateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  refund: async (id: string, options: CustomerPaymentWriteOptions): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.post(`/customer-payments/${id}/refund`, undefined, {
        headers: postDocumentHeaders(options.version, randomUuid()),
      }),
    ),
  cancel: async (
    id: string,
    options: CustomerPaymentWriteOptions & { reason?: string | null },
  ): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.post(
        `/customer-payments/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: CustomerPaymentWriteOptions): Promise<CustomerPayment> =>
    CustomerPaymentSchema.parse(
      await apiClient.delete(`/customer-payments/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/customer-payments/${id}/journal`)),
};
