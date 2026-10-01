import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { applyTypingRealtimeEvent } from "@/modules/communication/hooks/useTypingIndicator";
import { fillMessageGap } from "@/modules/communication/reliability/gap-fetch";
import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";
import {
  getHighestConfirmedSeq,
  isOptimisticSeq,
  upsertMessageInInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import {
  isDuplicateRealtimeEvent,
  isDuplicateUnreadMessageEvent,
} from "@/modules/communication/realtime/event-dedupe";
import type { RealtimeEvent } from "@/modules/communication/realtime/event-schemas";
import { getActiveConversationId } from "@/modules/communication/realtime/active-conversation";
import { lastMessageFromEventData } from "@/modules/communication/shared/last-message-preview";
import {
  invalidateConversationQueries,
  markConversationReadInCache,
  markConversationUnreadForRecipient,
  messageListQueryKey,
  patchConversationCaches,
  patchParticipantDeliveredSeq,
  patchParticipantReadSeq,
} from "@/modules/communication/shared/tenant-query";
import { replaceMessageInInfiniteData } from "@/modules/communication/messages/message-list-utils";

type ApplyRealtimeEventOptions = {
  currentUserId?: string | null;
};

const messageListRefetchTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleActiveMessageListRefetch(
  queryClient: QueryClient,
  messageListKey: readonly unknown[],
): void {
  const timerKey = JSON.stringify(messageListKey);
  const existing = messageListRefetchTimers.get(timerKey);
  if (existing) {
    clearTimeout(existing);
  }
  messageListRefetchTimers.set(
    timerKey,
    setTimeout(() => {
      messageListRefetchTimers.delete(timerKey);
      void queryClient.refetchQueries({ queryKey: messageListKey, type: "active" });
    }, 400),
  );
}

function parseEventUpToSeq(event: RealtimeEvent): number | null {
  const raw = event.data.up_to_seq ?? event.seq;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseEventSeq(event: RealtimeEvent): number | null {
  const raw: unknown = event.seq;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function buildMessageFromCreatedEvent(
  event: RealtimeEvent,
  conversationId: string,
  data: Partial<Message>,
  existing: Message | undefined,
): Message | null {
  const id = typeof data.id === "string" ? data.id : existing?.id;
  if (!id) {
    return null;
  }

  const seq =
    parseEventSeq(event) ??
    (typeof data.seq === "number" && Number.isFinite(data.seq) ? data.seq : null) ??
    (existing && !isOptimisticSeq(existing.seq) ? existing.seq : null);
  if (seq == null || isOptimisticSeq(seq)) {
    return null;
  }

  const clientMessageId =
    typeof data.client_message_id === "string"
      ? data.client_message_id
      : existing?.client_message_id ?? null;

  const attachmentRaw = data.attachment ?? existing?.attachment;
  return {
    id,
    conversation_id: conversationId,
    seq,
    sender_id:
      (data.sender_id as string | null | undefined) ??
      event.actor_id ??
      existing?.sender_id ??
      null,
    kind: (data.kind as Message["kind"]) ?? existing?.kind ?? "TEXT",
    body: (data.body as string | null | undefined) ?? existing?.body ?? null,
    reply_to_message_id:
      (data.reply_to_message_id as string | null | undefined) ??
      existing?.reply_to_message_id ??
      null,
    client_message_id: clientMessageId,
    edited_at: existing?.edited_at ?? null,
    deleted_at: existing?.deleted_at ?? null,
    created_at: event.at ?? existing?.created_at ?? new Date().toISOString(),
    system_payload:
      data.system_payload && typeof data.system_payload === "object"
        ? (data.system_payload as Message["system_payload"])
        : existing?.system_payload ?? null,
    attachment:
      attachmentRaw && typeof attachmentRaw === "object"
        ? {
            id: String((attachmentRaw as { id?: string }).id ?? ""),
            original_filename: String(
              (attachmentRaw as { original_filename?: string }).original_filename ?? "",
            ),
            content_type: String(
              (attachmentRaw as { content_type?: string }).content_type ?? "",
            ),
            size_bytes: Number((attachmentRaw as { size_bytes?: number }).size_bytes ?? 0),
            thumbnail_url:
              ((attachmentRaw as { thumbnail_url?: string | null }).thumbnail_url as
                | string
                | null
                | undefined) ?? null,
          }
        : undefined,
  };
}

export function applyRealtimeEvent(
  queryClient: QueryClient,
  tenantId: string,
  event: RealtimeEvent,
  options: ApplyRealtimeEventOptions = {},
): void {
  if (isDuplicateRealtimeEvent(event)) {
    return;
  }

  if (event.type === "presence.changed") {
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === "communication" &&
        query.queryKey[1] === "presence" &&
        query.queryKey.at(-1) === tenantId,
    });
    return;
  }

  const conversationId = event.conversation_id;
  if (!conversationId) {
    if (event.type.startsWith("call.")) {
      return;
    }
    invalidateConversationQueries(queryClient, tenantId);
    return;
  }

  const messageListKey = messageListQueryKey(conversationId, tenantId);

  if (event.type === "message.created") {
    const data = event.data as Partial<Message>;
    const clientMessageId =
      typeof data.client_message_id === "string" ? data.client_message_id : null;
    const incomingId = typeof data.id === "string" ? data.id : null;
    let cacheUpdated = false;

    queryClient.setQueryData<InfiniteData<MessageListPage>>(messageListKey, (current) => {
      const rows = current?.pages.flatMap((page) => page.items) ?? [];
      const existingByClient = clientMessageId
        ? rows.find((row) => row.client_message_id === clientMessageId)
        : undefined;
      const existingById = incomingId ? rows.find((row) => row.id === incomingId) : undefined;
      const existing = existingByClient ?? existingById;
      const message = buildMessageFromCreatedEvent(event, conversationId, data, existing);
      if (!message) {
        return current;
      }

      const highestConfirmed = getHighestConfirmedSeq(current);
      if (current?.pages.length && message.seq > highestConfirmed + 1) {
        void fillMessageGap(
          queryClient,
          tenantId,
          conversationId,
          highestConfirmed,
          message.seq,
        );
      }

      cacheUpdated = true;
      return upsertMessageInInfiniteData(current, message, clientMessageId);
    });

    if (!cacheUpdated) {
      scheduleActiveMessageListRefetch(queryClient, messageListKey);
    } else {
      const highestConfirmedAfter = getHighestConfirmedSeq(
        queryClient.getQueryData<InfiniteData<MessageListPage>>(messageListKey),
      );
      const eventSeq = parseEventSeq(event);
      if (eventSeq != null && highestConfirmedAfter < eventSeq) {
        scheduleActiveMessageListRefetch(queryClient, messageListKey);
      }
    }
    const isActiveConversation =
      conversationId === getActiveConversationId() &&
      typeof document !== "undefined" &&
      document.visibilityState === "visible";
    const preview = lastMessageFromEventData(data, event.at);
    if (preview && typeof event.seq === "number") {
      patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => {
        const shouldUpdatePreview =
          conversation.message_seq == null || event.seq! >= conversation.message_seq;
        return {
          ...conversation,
          last_message_at: event.at ?? conversation.last_message_at,
          message_seq: shouldUpdatePreview ? event.seq! : conversation.message_seq,
          last_message: shouldUpdatePreview ? preview : conversation.last_message,
        };
      });
    }
    if (
      !isActiveConversation &&
      !isDuplicateUnreadMessageEvent(event)
    ) {
      markConversationUnreadForRecipient(queryClient, tenantId, conversationId, {
        actorId: event.actor_id,
        currentUserId: options.currentUserId,
        at: event.at,
        seq: event.seq,
      });
    }
    return;
  }

  if (event.type === "message.read") {
    const readerId =
      typeof event.data.user_id === "string" ? event.data.user_id : event.actor_id ?? null;
    const upToSeq = parseEventUpToSeq(event);
    if (readerId && upToSeq != null) {
      patchParticipantReadSeq(queryClient, tenantId, conversationId, readerId, upToSeq);
      if (readerId === options.currentUserId) {
        markConversationReadInCache(queryClient, tenantId, conversationId);
      }
    }
    return;
  }

  if (event.type === "message.delivered") {
    const recipientId =
      typeof event.data.user_id === "string" ? event.data.user_id : event.actor_id ?? null;
    const upToSeq = parseEventUpToSeq(event);
    if (recipientId && upToSeq != null) {
      patchParticipantDeliveredSeq(queryClient, tenantId, conversationId, recipientId, upToSeq);
    }
    return;
  }

  if (event.type === "typing.started" || event.type === "typing.stopped") {
    applyTypingRealtimeEvent(conversationId, event.actor_id, event.type);
    return;
  }

  if (event.type === "message.updated" || event.type === "message.deleted") {
    const messageId =
      typeof event.data.id === "string"
        ? event.data.id
        : typeof event.data.message_id === "string"
          ? event.data.message_id
          : null;
    if (messageId) {
      queryClient.setQueryData<InfiniteData<MessageListPage>>(messageListKey, (current) => {
        if (!current) {
          return current;
        }
        if (event.type === "message.deleted") {
          return replaceMessageInInfiniteData(
            current,
            (row) => row.id === messageId,
            {
              ...(current.pages.flatMap((p) => p.items).find((r) => r.id === messageId) as Message),
              deleted_at: event.at ?? new Date().toISOString(),
              body: null,
            },
          )!;
        }
        const patch = event.data as Partial<Message>;
        return replaceMessageInInfiniteData(
          current,
          (row) => row.id === messageId,
          {
            ...(current.pages.flatMap((p) => p.items).find((r) => r.id === messageId) as Message),
            ...patch,
            id: messageId,
            edited_at: (patch.edited_at as string | null | undefined) ?? event.at ?? null,
          },
        )!;
      });
    } else {
      queryClient.invalidateQueries({ queryKey: messageListKey });
    }
    return;
  }

  if (event.type === "message.reaction_changed" || event.type === "message.pinned") {
    queryClient.invalidateQueries({ queryKey: messageListKey, refetchType: "none" });
    return;
  }

  if (event.type.startsWith("conversation.") || event.type.startsWith("participant.")) {
    invalidateConversationQueries(queryClient, tenantId);
  }
}
