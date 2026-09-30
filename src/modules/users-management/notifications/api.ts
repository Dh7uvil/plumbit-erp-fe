import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  NotificationListSchema,
  NotificationSchema,
  UnreadCountSchema,
  type Notification,
  type NotificationListParams,
  type UnreadCount,
} from "@/modules/users-management/notifications/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const notificationsApi = {
  list: async (params: NotificationListParams = {}): Promise<ListResponse<Notification[]>> => {
    const result = await apiClient.getList<unknown>("/notifications", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        unread_only: params.unread_only,
        sort_by: params.sort_by ?? "created_at",
        sort_order: params.sort_order ?? "desc",
      },
    });
    return { data: NotificationListSchema.parse(result.data), meta: result.meta };
  },
  unreadCount: async (): Promise<UnreadCount> =>
    UnreadCountSchema.parse(await apiClient.get("/notifications/unread-count")),
  markRead: async (id: string): Promise<Notification> =>
    NotificationSchema.parse(await apiClient.post(`/notifications/${id}/read`)),
  markAllRead: async (): Promise<UnreadCount> =>
    UnreadCountSchema.parse(await apiClient.post("/notifications/read-all")),
};
