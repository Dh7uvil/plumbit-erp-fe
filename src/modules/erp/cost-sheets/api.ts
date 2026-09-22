import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { LandedCostSchema, type LandedCost } from "@/modules/erp/landed-costs/schemas";
import {
  CostSheetCreateRequestSchema,
  CostSheetListSchema,
  CostSheetSchema,
  CostSheetUpdateRequestSchema,
  type CostSheet,
  type CostSheetCreateRequest,
  type CostSheetListParams,
  type CostSheetUpdateRequest,
} from "@/modules/erp/cost-sheets/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type CostSheetWriteOptions = { version: number };

export const costSheetsApi = {
  list: async (params: CostSheetListParams = {}): Promise<ListResponse<CostSheet[]>> => {
    const result = await apiClient.getList<unknown>("/cost-sheets", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        sheet_type: params.sheet_type,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: CostSheetListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<CostSheet> =>
    CostSheetSchema.parse(await apiClient.get(`/cost-sheets/${id}`)),
  create: async (values: CostSheetCreateRequest): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.post("/cost-sheets", CostSheetCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: CostSheetUpdateRequest,
    options: CostSheetWriteOptions,
  ): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.patch(
        `/cost-sheets/${id}`,
        CostSheetUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: CostSheetWriteOptions): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.delete(`/cost-sheets/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  confirm: async (id: string, options: CostSheetWriteOptions): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.post(
        `/cost-sheets/${id}/confirm`,
        { version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  close: async (id: string, options: CostSheetWriteOptions): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.post(
        `/cost-sheets/${id}/close`,
        { version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  reopen: async (id: string, options: CostSheetWriteOptions): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.post(
        `/cost-sheets/${id}/reopen`,
        { version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  pullActuals: async (id: string, options: CostSheetWriteOptions): Promise<CostSheet> =>
    CostSheetSchema.parse(
      await apiClient.post(
        `/cost-sheets/${id}/pull-actuals`,
        { version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  createLandedCost: async (
    id: string,
    options: CostSheetWriteOptions & { document_date?: string },
  ): Promise<LandedCost> =>
    LandedCostSchema.parse(
      await apiClient.post(
        `/cost-sheets/${id}/create-landed-cost`,
        { version: options.version, document_date: options.document_date },
        {
          headers: {
            ...ifMatchHeaders(options.version),
            "Idempotency-Key": randomUuid(),
          },
        },
      ),
    ),
};
