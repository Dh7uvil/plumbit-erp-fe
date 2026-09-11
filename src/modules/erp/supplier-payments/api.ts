import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  PaymentAllocateRequestSchema,
  SupplierPaymentCreateRequestSchema,
  SupplierPaymentListSchema,
  SupplierPaymentSchema,
  SupplierPaymentUpdateRequestSchema,
  type PaymentAllocateRequest,
  type SupplierPayment,
  type SupplierPaymentCreateRequest,
  type SupplierPaymentListParams,
  type SupplierPaymentUpdateRequest,
} from "@/modules/erp/supplier-payments/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type SupplierPaymentWriteOptions = { version: number };

export const supplierPaymentsApi = {
  list: async (
    params: SupplierPaymentListParams = {},
  ): Promise<ListResponse<SupplierPayment[]>> => {
    const result = await apiClient.getList<unknown>("/supplier-payments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        supplier_id: params.supplier_id,
        purchase_order_id: params.purchase_order_id,
        currency_id: params.currency_id,
        payment_method: params.payment_method,
        payment_date_from: params.payment_date_from,
        payment_date_to: params.payment_date_to,
      },
    });
    return { data: SupplierPaymentListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(await apiClient.get(`/supplier-payments/${id}`)),
  create: async (values: SupplierPaymentCreateRequest): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.post("/supplier-payments", SupplierPaymentCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: SupplierPaymentUpdateRequest,
    options: SupplierPaymentWriteOptions,
  ): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.patch(
        `/supplier-payments/${id}`,
        SupplierPaymentUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: SupplierPaymentWriteOptions): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.post(`/supplier-payments/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  allocate: async (
    id: string,
    values: PaymentAllocateRequest,
    options: SupplierPaymentWriteOptions,
  ): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.post(
        `/supplier-payments/${id}/allocate`,
        PaymentAllocateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  refund: async (id: string, options: SupplierPaymentWriteOptions): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.post(`/supplier-payments/${id}/refund`, undefined, {
        headers: postDocumentHeaders(options.version, randomUuid()),
      }),
    ),
  cancel: async (
    id: string,
    options: SupplierPaymentWriteOptions & { reason?: string | null },
  ): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.post(
        `/supplier-payments/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: SupplierPaymentWriteOptions): Promise<SupplierPayment> =>
    SupplierPaymentSchema.parse(
      await apiClient.delete(`/supplier-payments/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/supplier-payments/${id}/journal`)),
};
