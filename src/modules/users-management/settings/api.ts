import { apiClient } from "@/shared/api/client";
import { MeSchema, type Me } from "@/modules/users-management/auth/schemas";
import {
  MeUpdateSchema,
  NotificationPreferenceSchema,
  NotificationPreferenceUpdateSchema,
  type MeUpdate,
  type NotificationPreference,
  type NotificationPreferenceUpdate,
} from "@/modules/users-management/settings/schemas";

export const settingsApi = {
  updateMe: async (input: MeUpdate): Promise<Me> =>
    MeSchema.parse(await apiClient.patch("/auth/me", MeUpdateSchema.parse(input))),
  getNotificationPreferences: async (): Promise<NotificationPreference> =>
    NotificationPreferenceSchema.parse(await apiClient.get("/users/me/notification-preferences")),
  updateNotificationPreferences: async (
    input: NotificationPreferenceUpdate,
  ): Promise<NotificationPreference> =>
    NotificationPreferenceSchema.parse(
      await apiClient.patch(
        "/users/me/notification-preferences",
        NotificationPreferenceUpdateSchema.parse(input),
      ),
    ),
};
