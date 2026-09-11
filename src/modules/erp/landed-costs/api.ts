import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { JournalEntrySchema, type JournalEntry } from "@/modules/erp/accounting/journals/schemas";
import {
  LandedCostCreateFromBillsSchema,
  LandedCostCreateRequestSchema,
  LandedCostEligibleSchema,
  LandedCostListSchema,
  LandedCostSchema,
  LandedCostUpdateRequestSchema,
  type LandedCost,
  type LandedCostCreateFromBills,
  type LandedCostCreateRequest,
  type LandedCostEligible,
  type LandedCostListParams,
  type LandedCostUpdateRequest,
} from "@/modules/erp/landed-costs/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type LandedCostWriteOptions = { version: number };

export const landedCostsApi = {
  list: async (params: LandedCostListParams = {}): Promise<ListResponse<LandedCost[]>> => {
    const result = await apiClient.getList<unknown>("/landed-costs", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        shipment_id: params.shipment_id,
        goods_receipt_id: params.goods_receipt_id,
        purchase_invoice_id: params.purchase_invoice_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: LandedCostListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<LandedCost> =>
    LandedCostSchema.parse(await apiClient.get(`/landed-costs/${id}`)),
  create: async (values: LandedCostCreateRequest): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.post("/landed-costs", LandedCostCreateRequestSchema.parse(values)),
    ),
  createFromBills: async (values: LandedCostCreateFromBills): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.post(
        "/landed-costs/from-bills",
        LandedCostCreateFromBillsSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: LandedCostUpdateRequest,
    options: LandedCostWriteOptions,
  ): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.patch(
        `/landed-costs/${id}`,
        LandedCostUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: LandedCostWriteOptions): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.post(`/landed-costs/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: LandedCostWriteOptions & { reason?: string | null },
  ): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.post(
        `/landed-costs/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: LandedCostWriteOptions): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.delete(`/landed-costs/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  journal: async (id: string): Promise<JournalEntry> =>
    JournalEntrySchema.parse(await apiClient.get(`/landed-costs/${id}/journal`)),
};

export const goodsReceiptLandedCostApi = {
  eligible: async (receiptId: string): Promise<LandedCostEligible> =>
    LandedCostEligibleSchema.parse(
      await apiClient.get(`/goods-receipts/${receiptId}/landed-cost-eligible`),
    ),
};
