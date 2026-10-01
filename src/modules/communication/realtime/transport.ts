"use client";

export type { RtmSyncMode as RealtimeSyncMode } from "@/modules/communication/realtime/ws-client";
export {
  clearCommunicationSessionStorage,
  connectRtm,
  getCommunicationPollIntervalMs,
  nudgeRtmReconnect,
  resubscribePendingChannels,
  scheduleRtmReconnect,
  sendTypingOverSocket as sendTyping,
  subscribeConversationChannel,
  unsubscribeConversationChannel,
} from "@/modules/communication/realtime/ws-client";

export const isWebSocketTransport = true;
