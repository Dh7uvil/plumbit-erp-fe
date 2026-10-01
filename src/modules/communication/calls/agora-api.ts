import { z } from "zod";

import { apiClient } from "@/shared/api/client";

const RtcTokenResponseSchema = z.object({
  token: z.string(),
  rtc_uid: z.number(),
  channel_name: z.string(),
  expires_at: z.string(),
});

export type RtcTokenResponse = z.infer<typeof RtcTokenResponseSchema>;

export const agoraApi = {
  mintRtcToken: async (payload: { channel_name: string; call_id: string }): Promise<RtcTokenResponse> =>
    RtcTokenResponseSchema.parse(await apiClient.post("/communication/agora/rtc-token", payload)),
};
