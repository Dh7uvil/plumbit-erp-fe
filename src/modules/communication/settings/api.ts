import {
  ChatNotificationSettingsSchema,
  ChatNotificationSettingsUpdateSchema,
  type ChatNotificationSettings,
  type ChatNotificationSettingsUpdate,
} from "@/modules/communication/settings/schemas";
import { apiClient } from "@/shared/api/client";

const BASE = "/communication/settings/notifications";

export const communicationSettingsApi = {
  get: async (): Promise<ChatNotificationSettings> =>
    ChatNotificationSettingsSchema.parse(await apiClient.get(BASE)),
  update: async (values: ChatNotificationSettingsUpdate): Promise<ChatNotificationSettings> =>
    ChatNotificationSettingsSchema.parse(
      await apiClient.patch(BASE, ChatNotificationSettingsUpdateSchema.parse(values)),
    ),
};
