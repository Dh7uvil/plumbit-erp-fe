import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { QuotationListSchema } from "@/modules/erp/quotations/schemas";
import {
  OpportunityCreateRequestSchema,
  OpportunityListSchema,
  OpportunitySchema,
  OpportunityUpdateRequestSchema,
  type Opportunity,
  type OpportunityCreateRequest,
  type OpportunityListParams,
  type OpportunityUpdateRequest,
} from "@/modules/crm/opportunities/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export const opportunitiesApi = {
  list: async (params: OpportunityListParams = {}): Promise<ListResponse<Opportunity[]>> => {
    const result = await apiClient.getList<unknown>("/opportunities", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        pipeline_id: params.pipeline_id,
        stage_id: params.stage_id,
        owner_id: params.owner_id,
        customer_id: params.customer_id,
        source_id: params.source_id,
      },
    });
    return { data: OpportunityListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Opportunity> =>
    OpportunitySchema.parse(await apiClient.get(`/opportunities/${id}`)),
  create: async (values: OpportunityCreateRequest): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.post("/opportunities", OpportunityCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: OpportunityUpdateRequest, version: number): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.patch(`/opportunities/${id}`, OpportunityUpdateRequestSchema.parse(values), {
        headers: ifMatchHeaders(version),
      }),
    ),
  delete: async (id: string): Promise<Opportunity> =>
    OpportunitySchema.parse(await apiClient.delete(`/opportunities/${id}`)),
  changeStage: async (
    id: string,
    stageId: string,
    version: number,
    lostReasonId?: string | null,
  ): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.post(
        `/opportunities/${id}/stage`,
        { stage_id: stageId, lost_reason_id: lostReasonId ?? null },
        { headers: ifMatchHeaders(version) },
      ),
    ),
  win: async (id: string, version: number): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.post(`/opportunities/${id}/win`, {}, { headers: ifMatchHeaders(version) }),
    ),
  lose: async (id: string, lostReasonId: string, version: number): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.post(
        `/opportunities/${id}/lose`,
        { lost_reason_id: lostReasonId },
        { headers: ifMatchHeaders(version) },
      ),
    ),
  reopen: async (id: string, version: number): Promise<Opportunity> =>
    OpportunitySchema.parse(
      await apiClient.post(`/opportunities/${id}/reopen`, {}, { headers: ifMatchHeaders(version) }),
    ),
  listQuotations: async (id: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
    const result = await apiClient.getList<unknown>(`/opportunities/${id}/quotations`, {
      params: { page, page_size: pageSize },
    });
    return { data: QuotationListSchema.parse(result.data), meta: result.meta };
  },
};
