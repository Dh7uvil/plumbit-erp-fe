import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  DebitNoteCreateFromPurchaseInvoiceSchema,
  DebitNoteCreateRequestSchema,
  DebitNoteListSchema,
  DebitNoteSchema,
  DebitNoteUpdateRequestSchema,
  type DebitNote,
  type DebitNoteCreateFromPurchaseInvoice,
  type DebitNoteCreateRequest,
  type DebitNoteListParams,
  type DebitNoteUpdateRequest,
} from "@/modules/erp/debit-notes/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type DebitNoteWriteOptions = { version: number };

export const debitNotesApi = {
  list: async (params: DebitNoteListParams = {}): Promise<ListResponse<DebitNote[]>> => {
    const result = await apiClient.getList<unknown>("/debit-notes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        supplier_id: params.supplier_id,
        purchase_invoice_id: params.purchase_invoice_id,
        currency_id: params.currency_id,
        debit_note_date_from: params.debit_note_date_from,
        debit_note_date_to: params.debit_note_date_to,
      },
    });
    return { data: DebitNoteListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<DebitNote> =>
    DebitNoteSchema.parse(await apiClient.get(`/debit-notes/${id}`)),
  create: async (values: DebitNoteCreateRequest): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.post("/debit-notes", DebitNoteCreateRequestSchema.parse(values)),
    ),
  createFromPurchaseInvoice: async (
    values: DebitNoteCreateFromPurchaseInvoice,
  ): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.post(
        "/debit-notes/from-purchase-invoice",
        DebitNoteCreateFromPurchaseInvoiceSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: DebitNoteUpdateRequest,
    options: DebitNoteWriteOptions,
  ): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.patch(
        `/debit-notes/${id}`,
        DebitNoteUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: DebitNoteWriteOptions): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.post(`/debit-notes/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: DebitNoteWriteOptions & { reason?: string | null },
  ): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.post(
        `/debit-notes/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: DebitNoteWriteOptions): Promise<DebitNote> =>
    DebitNoteSchema.parse(
      await apiClient.delete(`/debit-notes/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/debit-notes/${id}/journal`)),
};
