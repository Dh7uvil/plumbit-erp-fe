import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  LeadConvertRequestSchema,
  LeadConvertResponseSchema,
  LeadCreateRequestSchema,
  LeadListSchema,
  LeadSchema,
  LeadStatusSchema,
  LeadUpdateRequestSchema,
  type Lead,
  type LeadConvertRequest,
  type LeadConvertResponse,
  type LeadCreateRequest,
  type LeadListParams,
  type LeadStatus,
  type LeadUpdateRequest,
} from "@/modules/crm/leads/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import { randomUuid } from "@/shared/lib/uuid";
import type { ListResponse } from "@/shared/api/envelope";

export const leadsApi = {
  list: async (params: LeadListParams = {}): Promise<ListResponse<Lead[]>> => {
    const result = await apiClient.getList<unknown>("/leads", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        source_id: params.source_id,
        owner_id: params.owner_id,
        rating: params.rating,
      },
    });
    return { data: LeadListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Lead> => LeadSchema.parse(await apiClient.get(`/leads/${id}`)),
  create: async (values: LeadCreateRequest): Promise<Lead> =>
    LeadSchema.parse(await apiClient.post("/leads", LeadCreateRequestSchema.parse(values))),
  update: async (id: string, values: LeadUpdateRequest, version: number): Promise<Lead> =>
    LeadSchema.parse(
      await apiClient.patch(`/leads/${id}`, LeadUpdateRequestSchema.parse(values), {
        headers: ifMatchHeaders(version),
      }),
    ),
  delete: async (id: string): Promise<Lead> =>
    LeadSchema.parse(await apiClient.delete(`/leads/${id}`)),
  assign: async (id: string, ownerId: string, version: number): Promise<Lead> =>
    LeadSchema.parse(
      await apiClient.post(
        `/leads/${id}/assign`,
        { owner_id: ownerId },
        { headers: ifMatchHeaders(version) },
      ),
    ),
  changeStatus: async (id: string, status: LeadStatus, version: number): Promise<Lead> =>
    LeadSchema.parse(
      await apiClient.post(
        `/leads/${id}/status`,
        { status: LeadStatusSchema.parse(status) },
        { headers: ifMatchHeaders(version) },
      ),
    ),
  convert: async (
    id: string,
    values: LeadConvertRequest,
    version: number,
    idempotencyKey = randomUuid(),
  ): Promise<LeadConvertResponse> =>
    LeadConvertResponseSchema.parse(
      await apiClient.post(
        `/leads/${id}/convert`,
        LeadConvertRequestSchema.parse(values),
        { headers: postDocumentHeaders(version, idempotencyKey) },
      ),
    ),
};
