import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { conversationKeys } from "@/modules/communication/conversations/queries";
import type { Conversation } from "@/modules/communication/conversations/schemas";
import { messageKeys } from "@/modules/communication/messages/queries";
import type { ListResponse } from "@/shared/api/envelope";

export function communicationQueryKey<T extends QueryKey>(
  key: T,
  tenantId: string,
): [...T, string] {
  return [...key, tenantId];
}

export function messageListQueryKey(conversationId: string, tenantId: string): QueryKey {
  return communicationQueryKey(messageKeys.infinite(conversationId), tenantId);
}

export function isCommunicationQueryForTenant(
  queryKey: QueryKey,
  tenantId: string,
  segment: "conversations" | "messages",
): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "communication" &&
    queryKey[1] === segment &&
    queryKey.at(-1) === tenantId
  );
}

export function invalidateCommunicationQueries(
  queryClient: QueryClient,
  tenantId: string,
  segment: "conversations" | "messages",
): void {
  queryClient.invalidateQueries({
    predicate: (query) => isCommunicationQueryForTenant(query.queryKey, tenantId, segment),
  });
}

export function invalidateConversationQueries(
  queryClient: QueryClient,
  tenantId: string,
): void {
  invalidateCommunicationQueries(queryClient, tenantId, "conversations");
}

export function refreshCommunicationLiveState(
  queryClient: QueryClient,
  tenantId: string,
  activeConversationId?: string | null,
): void {
  invalidateConversationQueries(queryClient, tenantId);
  invalidateCommunicationQueries(queryClient, tenantId, "messages");
  if (!activeConversationId) {
    return;
  }
  void queryClient.refetchQueries({
    queryKey: communicationQueryKey(conversationKeys.detail(activeConversationId), tenantId),
    type: "active",
  });
  void queryClient.refetchQueries({
    queryKey: messageListQueryKey(activeConversationId, tenantId),
    type: "active",
  });
}

export function conversationListQueryKey(
  tenantId: string,
  params: Parameters<typeof conversationKeys.list>[0] = {},
): QueryKey {
  return communicationQueryKey(conversationKeys.list(params), tenantId);
}

export function isConversationListQuery(queryKey: QueryKey, tenantId: string): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "communication" &&
    queryKey[1] === "conversations" &&
    queryKey[2] === "list" &&
    queryKey.at(-1) === tenantId
  );
}

export function patchConversationCaches(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  patch: (conversation: Conversation) => Conversation,
): void {
  queryClient.setQueriesData<ListResponse<Conversation[]>>(
    {
      predicate: (query) => isConversationListQuery(query.queryKey, tenantId),
    },
    (current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        data: current.data.map((conversation) =>
          conversation.id === conversationId ? patch(conversation) : conversation,
        ),
      };
    },
  );

  queryClient.setQueryData<Conversation>(
    communicationQueryKey(conversationKeys.detail(conversationId), tenantId),
    (current) => (current ? patch(current) : current),
  );
}

export function markConversationUnreadForRecipient(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  event: {
    actorId?: string | null;
    currentUserId?: string | null;
    at?: string | null;
    seq?: number | null;
  },
): void {
  patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => {
    const fromSelf = Boolean(
      event.actorId && event.currentUserId && event.actorId === event.currentUserId,
    );
    return {
      ...conversation,
      last_message_at: event.at ?? conversation.last_message_at,
      message_seq: event.seq ?? conversation.message_seq,
      unread_count: fromSelf ? 0 : conversation.unread_count + 1,
    };
  });
}

export function markConversationReadInCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
): void {
  patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
    ...conversation,
    unread_count: 0,
  }));
}

export function patchParticipantReadSeq(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  userId: string,
  upToSeq: number,
): void {
  patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
    ...conversation,
    participants: conversation.participants.map((participant) =>
      participant.user_id === userId
        ? {
            ...participant,
            last_read_seq: Math.max(participant.last_read_seq ?? 0, upToSeq),
          }
        : participant,
    ),
  }));
}

export function patchParticipantDeliveredSeq(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  userId: string,
  upToSeq: number,
): void {
  patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
    ...conversation,
    participants: conversation.participants.map((participant) =>
      participant.user_id === userId
        ? {
            ...participant,
            last_delivered_seq: Math.max(participant.last_delivered_seq ?? 0, upToSeq),
          }
        : participant,
    ),
  }));
}
