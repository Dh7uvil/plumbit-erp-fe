import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CampaignCreateRequestSchema,
  CampaignListSchema,
  CampaignMemberCreateRequestSchema,
  CampaignMemberListSchema,
  CampaignMemberSchema,
  CampaignMemberUpdateRequestSchema,
  CampaignRoiSchema,
  CampaignSchema,
  CampaignUpdateRequestSchema,
  type Campaign,
  type CampaignCreateRequest,
  type CampaignListParams,
  type CampaignMember,
  type CampaignMemberCreateRequest,
  type CampaignMemberUpdateRequest,
  type CampaignRoi,
  type CampaignUpdateRequest,
} from "@/modules/crm/campaigns/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const campaignsApi = {
  list: async (params: CampaignListParams = {}): Promise<ListResponse<Campaign[]>> => {
    const result = await apiClient.getList<unknown>("/campaigns", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        campaign_type: params.campaign_type,
        owner_id: params.owner_id,
      },
    });
    return { data: CampaignListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<Campaign[]> =>
    fetchAllPages((page, pageSize) => campaignsApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<Campaign> =>
    CampaignSchema.parse(await apiClient.get(`/campaigns/${id}`)),
  create: async (values: CampaignCreateRequest): Promise<Campaign> =>
    CampaignSchema.parse(
      await apiClient.post("/campaigns", CampaignCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: CampaignUpdateRequest): Promise<Campaign> =>
    CampaignSchema.parse(
      await apiClient.patch(`/campaigns/${id}`, CampaignUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Campaign> =>
    CampaignSchema.parse(await apiClient.delete(`/campaigns/${id}`)),
  listMembers: async (
    id: string,
    params: { page?: number; page_size?: number } = {},
  ): Promise<ListResponse<CampaignMember[]>> => {
    const result = await apiClient.getList<unknown>(`/campaigns/${id}/members`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
      },
    });
    return { data: CampaignMemberListSchema.parse(result.data), meta: result.meta };
  },
  addMember: async (id: string, values: CampaignMemberCreateRequest): Promise<CampaignMember> =>
    CampaignMemberSchema.parse(
      await apiClient.post(
        `/campaigns/${id}/members`,
        CampaignMemberCreateRequestSchema.parse(values),
      ),
    ),
  updateMember: async (
    id: string,
    memberId: string,
    values: CampaignMemberUpdateRequest,
  ): Promise<CampaignMember> =>
    CampaignMemberSchema.parse(
      await apiClient.patch(
        `/campaigns/${id}/members/${memberId}`,
        CampaignMemberUpdateRequestSchema.parse(values),
      ),
    ),
  removeMember: async (id: string, memberId: string): Promise<CampaignMember> =>
    CampaignMemberSchema.parse(await apiClient.delete(`/campaigns/${id}/members/${memberId}`)),
  roi: async (id: string): Promise<CampaignRoi> =>
    CampaignRoiSchema.parse(await apiClient.get(`/campaigns/${id}/roi`)),
};
