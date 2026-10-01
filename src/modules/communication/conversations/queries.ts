"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { conversationsApi } from "@/modules/communication/conversations/api";
import type { ConversationListParams } from "@/modules/communication/conversations/schemas";
import { getCommunicationPollIntervalMs } from "@/modules/communication/realtime/transport";
import { useRealtimeContext } from "@/modules/communication/realtime/realtime-provider";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const conversationKeys = {
  all: ["communication", "conversations"] as const,
  list: (params: ConversationListParams) => [...conversationKeys.all, "list", params] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  unread: () => [...conversationKeys.all, "unread-summary"] as const,
  attachments: (id: string, kind?: "file" | "media") =>
    [...conversationKeys.all, "attachments", id, kind ?? "all"] as const,
};

export function useConversations(params: ConversationListParams = {}) {
  const { syncMode } = useRealtimeContext();
  return useQuery({
    queryKey: useTenantQueryKey(conversationKeys.list(params)),
    queryFn: () => conversationsApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: getCommunicationPollIntervalMs(syncMode),
  });
}

export function useConversation(id: string | null) {
  const { syncMode } = useRealtimeContext();
  return useQuery({
    queryKey: useTenantQueryKey(conversationKeys.detail(id ?? "")),
    queryFn: () => conversationsApi.get(id!),
    enabled: Boolean(id),
    refetchInterval: getCommunicationPollIntervalMs(syncMode),
  });
}

export function useUnreadSummary() {
  return useQuery({
    queryKey: useTenantQueryKey(conversationKeys.unread()),
    queryFn: () => conversationsApi.unreadSummary(),
    refetchInterval: 60_000,
  });
}

export function useConversationAttachments(
  conversationId: string | null,
  kind?: "file" | "media",
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: useTenantQueryKey(conversationKeys.attachments(conversationId ?? "", kind)),
    queryFn: () => conversationsApi.listAttachments(conversationId!, kind),
    enabled: Boolean(conversationId) && (options?.enabled ?? true),
  });
}
