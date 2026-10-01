import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CallCreateRequestSchema,
  CallListSchema,
  CallMediaUpdateRequestSchema,
  CallSchema,
  type Call,
  type CallCreateRequest,
  type CallListParams,
  type CallMediaUpdateRequest,
} from "@/modules/communication/calls/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

const BASE = "/communication/calls";

export const callsApi = {
  list: async (params: CallListParams = {}): Promise<ListResponse<Call[]>> => {
    const result = await apiClient.getList<unknown>(BASE, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        conversation_id: params.conversation_id,
        mine: params.mine,
      },
    });
    return { data: CallListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Call> => CallSchema.parse(await apiClient.get(`${BASE}/${id}`)),
  create: async (values: CallCreateRequest): Promise<Call> =>
    CallSchema.parse(await apiClient.post(BASE, CallCreateRequestSchema.parse(values))),
  accept: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/accept`, {})),
  reject: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/reject`, {})),
  join: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/join`, {})),
  leave: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/leave`, {})),
  end: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/end`, {})),
  updateMedia: async (id: string, values: CallMediaUpdateRequest): Promise<Call> =>
    CallSchema.parse(
      await apiClient.patch(`${BASE}/${id}/media`, CallMediaUpdateRequestSchema.parse(values)),
    ),
  refreshToken: async (id: string): Promise<Call> =>
    CallSchema.parse(await apiClient.post(`${BASE}/${id}/token/refresh`, {})),
};
