import {
  HeartbeatRequestSchema,
  PresenceListSchema,
  PresenceSchema,
  type HeartbeatRequest,
  type Presence,
} from "@/modules/communication/presence/schemas";
import { apiClient } from "@/shared/api/client";

export const presenceApi = {
  getPresence: async (userIds: string[]): Promise<Presence[]> => {
    const data = await apiClient.get<unknown>("/communication/presence", {
      params: { user_ids: userIds },
    });
    return PresenceListSchema.parse(data);
  },
  heartbeat: async (values: HeartbeatRequest = { status: "ONLINE" }): Promise<Presence> => {
    const payload = HeartbeatRequestSchema.parse(values);
    const data = await apiClient.post("/communication/presence/heartbeat", payload);
    return PresenceSchema.parse(data);
  },
};
