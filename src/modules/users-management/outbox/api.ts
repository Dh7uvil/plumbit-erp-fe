import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  OutboxEventDetailSchema,
  OutboxEventListSchema,
  type OutboxEvent,
  type OutboxEventDetail,
  type OutboxListParams,
} from "@/modules/users-management/outbox/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export const outboxApi = {
  list: async (params: OutboxListParams = {}): Promise<ListResponse<OutboxEvent[]>> => {
    const result = await apiClient.getList<unknown>("/outbox-events", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        search: params.search,
        status: params.status,
        event_type: params.event_type,
      },
    });
    return { data: OutboxEventListSchema.parse(result.data), meta: result.meta };
  },
  byId: async (id: string): Promise<OutboxEventDetail> =>
    OutboxEventDetailSchema.parse(await apiClient.get(`/outbox-events/${id}`)),
  retry: async (id: string): Promise<void> => {
    await apiClient.post(`/outbox-events/${id}/retry`, undefined, {
      headers: { "Idempotency-Key": randomUuid() },
    });
  },
};
