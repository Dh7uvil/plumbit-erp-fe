import { z } from "zod";

export const ChatNotificationSettingsSchema = z.object({
  user_id: z.string().uuid(),
  message_notifications: z.boolean(),
  group_notifications: z.boolean(),
  call_notifications: z.boolean(),
  sound_enabled: z.boolean(),
  desktop_notifications: z.boolean(),
  mobile_notifications: z.boolean(),
});
export type ChatNotificationSettings = z.infer<typeof ChatNotificationSettingsSchema>;

export const ChatNotificationSettingsUpdateSchema = z.object({
  message_notifications: z.boolean().optional(),
  group_notifications: z.boolean().optional(),
  call_notifications: z.boolean().optional(),
  sound_enabled: z.boolean().optional(),
  desktop_notifications: z.boolean().optional(),
  mobile_notifications: z.boolean().optional(),
});
export type ChatNotificationSettingsUpdate = z.infer<typeof ChatNotificationSettingsUpdateSchema>;
