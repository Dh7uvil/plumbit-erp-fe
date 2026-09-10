import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  CreditNoteCreateFromSalesInvoiceSchema,
  CreditNoteCreateFromSalesReturnSchema,
  CreditNoteCreateRequestSchema,
  CreditNoteListSchema,
  CreditNoteSchema,
  CreditNoteUpdateRequestSchema,
  type CreditNote,
  type CreditNoteCreateFromSalesInvoice,
  type CreditNoteCreateFromSalesReturn,
  type CreditNoteCreateRequest,
  type CreditNoteListParams,
  type CreditNoteUpdateRequest,
} from "@/modules/erp/credit-notes/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type CreditNoteWriteOptions = { version: number };

export const creditNotesApi = {
  list: async (params: CreditNoteListParams = {}): Promise<ListResponse<CreditNote[]>> => {
    const result = await apiClient.getList<unknown>("/credit-notes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        customer_id: params.customer_id,
        sales_invoice_id: params.sales_invoice_id,
        sales_return_id: params.sales_return_id,
        currency_id: params.currency_id,
        credit_note_date_from: params.credit_note_date_from,
        credit_note_date_to: params.credit_note_date_to,
      },
    });
    return { data: CreditNoteListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<CreditNote> =>
    CreditNoteSchema.parse(await apiClient.get(`/credit-notes/${id}`)),
  create: async (values: CreditNoteCreateRequest): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.post("/credit-notes", CreditNoteCreateRequestSchema.parse(values)),
    ),
  createFromSalesInvoice: async (values: CreditNoteCreateFromSalesInvoice): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.post(
        "/credit-notes/from-sales-invoice",
        CreditNoteCreateFromSalesInvoiceSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  createFromSalesReturn: async (values: CreditNoteCreateFromSalesReturn): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.post(
        "/credit-notes/from-sales-return",
        CreditNoteCreateFromSalesReturnSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: CreditNoteUpdateRequest,
    options: CreditNoteWriteOptions,
  ): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.patch(
        `/credit-notes/${id}`,
        CreditNoteUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: CreditNoteWriteOptions): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.post(`/credit-notes/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: CreditNoteWriteOptions & { reason?: string | null },
  ): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.post(
        `/credit-notes/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: CreditNoteWriteOptions): Promise<CreditNote> =>
    CreditNoteSchema.parse(
      await apiClient.delete(`/credit-notes/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/credit-notes/${id}/journal`)),
};
