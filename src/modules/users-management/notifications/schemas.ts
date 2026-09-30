import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  event: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().nullable(),
  title: z.string(),
  body: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.array(NotificationSchema);

export const UnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCount = z.infer<typeof UnreadCountSchema>;

export type NotificationListParams = {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};
