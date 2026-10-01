"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ActiveCallJoinBanner } from "@/modules/communication/calls/components/ActiveCallJoinBanner";
import {
  useActiveCallSession,
  useBeginCall,
} from "@/modules/communication/calls/call-session-context";
import { useCreateCall } from "@/modules/communication/calls/mutations";
import {
  CommEmptyState,
  CommForwardDialog,
  CommMessageSkeleton,
} from "@/modules/communication/components/ui";
import { useMarkConversationRead, useSendTyping } from "@/modules/communication/conversations/mutations";
import { conversationKeys, useConversation } from "@/modules/communication/conversations/queries";
import { useMessageActions, useSubmitMessageEdit } from "@/modules/communication/hooks/useMessageActions";
import { useTypingIndicator } from "@/modules/communication/hooks/useTypingIndicator";
import { ChatWindow } from "@/modules/communication/messages/components/ChatWindow";
import {
  isRetriableSendError,
  useMarkDelivered,
  useSendMessage,
} from "@/modules/communication/messages/mutations";
import {
  isOptimisticSeq,
  upsertMessageInInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import { reconcileMessagesThroughSeq } from "@/modules/communication/reliability/gap-fetch";
import { useMessages } from "@/modules/communication/messages/queries";
import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";
import { usePresence } from "@/modules/communication/presence/queries";
import { listPendingMessages } from "@/modules/communication/reliability/outbox";
import { enqueuePendingMessage, flushOutbox } from "@/modules/communication/reliability/outbox";
import {
  getActiveConversationId,
  setActiveConversationId,
} from "@/modules/communication/realtime/active-conversation";
import { useRealtimeContext } from "@/modules/communication/realtime/realtime-provider";
import {
  resubscribePendingChannels,
  subscribeConversationChannel,
  unsubscribeConversationChannel,
} from "@/modules/communication/realtime/transport";
import { conversationLabel } from "@/modules/communication/shared/conversation-label";
import {
  buildConversationUserNames,
  useUserDirectory,
} from "@/modules/communication/shared/use-user-directory";
import {
  communicationQueryKey,
  messageListQueryKey,
  patchConversationCaches,
} from "@/modules/communication/shared/tenant-query";
import { useMe } from "@/modules/users-management/auth/queries";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";
import { randomUuid } from "@/shared/lib/uuid";

function peerSeq(
  conversation: {
    participants: { user_id: string; last_read_seq?: number; last_delivered_seq?: number }[];
  },
  currentUserId: string,
  field: "last_read_seq" | "last_delivered_seq",
): number {
  const other = conversation.participants.find((p) => p.user_id !== currentUserId);
  return other?.[field] ?? 0;
}

export function MessageThreadPanel({
  conversationId,
  scrollToSeq,
  detailOpen,
  onToggleDetail,
}: {
  conversationId: string;
  scrollToSeq?: number;
  detailOpen?: boolean;
  onToggleDetail?: () => void;
}) {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { connected, syncMode } = useRealtimeContext();
  const { data: conversation, isLoading: conversationLoading, isError: conversationError } =
    useConversation(conversationId);
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();
  const markDelivered = useMarkDelivered();
  const sendTyping = useSendTyping();
  const typingIdleTimerRef = useRef<number | null>(null);
  const createCall = useCreateCall();
  const beginCall = useBeginCall();
  const activeCall = useActiveCallSession();
  const submitEdit = useSubmitMessageEdit();
  const { byId } = useUserDirectory();
  const [draftByConversation, setDraftByConversation] = useState<Record<string, string>>({});
  const [failedClientIds, setFailedClientIds] = useState<Set<string>>(() => new Set());
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const lastMarkedSeqRef = useRef(0);
  const prevConnectedRef = useRef(false);
  const prevSyncModeRef = useRef(syncMode);
  const sendMessageRef = useRef(sendMessage.mutateAsync);
  const sendTypingRef = useRef(sendTyping.mutate);
  const typingActiveRef = useRef(false);
  const typingUsers = useTypingIndicator(conversationId);
  const draft = draftByConversation[conversationId] ?? "";
  const setDraft = useCallback(
    (value: string) => {
      setDraftByConversation((current) => ({ ...current, [conversationId]: value }));
    },
    [conversationId],
  );

  const lastSeq = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const seq = messages[index]?.seq;
      if (seq != null && !isOptimisticSeq(seq)) {
        return seq;
      }
    }
    return null;
  }, [messages]);

  const peerUserId = useMemo(() => {
    if (!conversation || !me || conversation.kind !== "DIRECT") {
      return null;
    }
    return conversation.participants.find((p) => p.user_id !== me.id)?.user_id ?? null;
  }, [conversation, me]);

  const { data: presence = [] } = usePresence(peerUserId ? [peerUserId] : []);
  const peerPresence = presence[0];

  const actions = useMessageActions({
    conversationId,
    currentUserId: me?.id,
    onEdit: (message) => setDraft(message?.body ?? ""),
    onRequestForward: (message) => setForwardMessage(message),
  });

  const userNames = useMemo(() => buildConversationUserNames(byId, me), [byId, me]);
  const peerReadSeq = useMemo(
    () => (conversation && me ? peerSeq(conversation, me.id, "last_read_seq") : 0),
    [conversation, me],
  );
  const peerDeliveredSeq = useMemo(
    () => (conversation && me ? peerSeq(conversation, me.id, "last_delivered_seq") : 0),
    [conversation, me],
  );

  const selfParticipant = useMemo(
    () => conversation?.participants.find((p) => p.user_id === me?.id),
    [conversation, me],
  );
  const firstUnreadSeq = useMemo(() => {
    if (!selfParticipant || !me || selfParticipant.last_read_seq <= 0) {
      return null;
    }
    let lowest: number | null = null;
    for (const message of messages) {
      if (isOptimisticSeq(message.seq)) {
        continue;
      }
      if (message.seq <= selfParticipant.last_read_seq) {
        continue;
      }
      if (message.sender_id === me.id) {
        continue;
      }
      lowest = lowest == null ? message.seq : Math.min(lowest, message.seq);
    }
    return lowest;
  }, [me, messages, selfParticipant]);

  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => {
      if (getActiveConversationId() === conversationId) {
        setActiveConversationId(null);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    sendMessageRef.current = sendMessage.mutateAsync;
  }, [sendMessage.mutateAsync]);

  useEffect(() => {
    sendTypingRef.current = sendTyping.mutate;
  }, [sendTyping.mutate]);

  useEffect(() => {
    const channelName = conversation?.channel_name;
    if (!channelName) {
      return;
    }
    void subscribeConversationChannel(channelName);
    if (connected && syncMode === "live") {
      void resubscribePendingChannels();
    }
    return () => {
      void unsubscribeConversationChannel(channelName);
    };
  }, [conversation?.channel_name, connected, syncMode]);

  useEffect(() => {
    const reconnected =
      connected &&
      syncMode === "live" &&
      (!prevConnectedRef.current || prevSyncModeRef.current !== "live");
    prevConnectedRef.current = connected;
    prevSyncModeRef.current = syncMode;

    if (!reconnected) {
      return;
    }

    void queryClient.refetchQueries({
      queryKey: communicationQueryKey(conversationKeys.detail(conversationId), tenantId),
      type: "active",
    });

    if (lastSeq == null || lastSeq <= 0) {
      return;
    }

    lastMarkedSeqRef.current = 0;
    markRead.mutate({ id: conversationId, upToSeq: lastSeq });
    markDelivered.mutate({ id: conversationId, upToSeq: lastSeq });
  }, [connected, conversationId, lastSeq, markDelivered, markRead, queryClient, syncMode, tenantId]);

  useEffect(() => {
    if (!me?.id) {
      return;
    }
    const refreshPending = async () => {
      const pending = await listPendingMessages(tenantId, me.id);
      const ids = new Set(
        pending
          .filter((entry) => entry.conversationId === conversationId)
          .map((entry) => entry.payload.client_message_id)
          .filter((id): id is string => Boolean(id)),
      );
      setFailedClientIds((current) => {
        if (current.size === ids.size && [...ids].every((id) => current.has(id))) {
          return current;
        }
        return ids;
      });
    };
    void refreshPending();
  }, [conversationId, me?.id, tenantId]);

  useEffect(() => {
    if (!me?.id) {
      return;
    }
    const flushPending = async () => {
      await flushOutbox(tenantId, me.id, conversationId, async (entry) => {
        await sendMessageRef.current(entry.payload);
      });
      const pending = await listPendingMessages(tenantId, me.id);
      const ids = new Set(
        pending
          .filter((entry) => entry.conversationId === conversationId)
          .map((entry) => entry.payload.client_message_id)
          .filter((id): id is string => Boolean(id)),
      );
      setFailedClientIds((current) => {
        if (current.size === ids.size && [...ids].every((id) => current.has(id))) {
          return current;
        }
        return ids;
      });
    };
    void flushPending();
    window.addEventListener("online", flushPending);
    return () => window.removeEventListener("online", flushPending);
  }, [conversationId, me?.id, tenantId]);

  useEffect(() => {
    lastMarkedSeqRef.current = 0;
  }, [conversationId]);

  useEffect(() => {
    const preview = conversation?.last_message;
    const previewSeq = conversation?.message_seq;
    if (!preview?.id || previewSeq == null || previewSeq <= 0) {
      return;
    }
    if (messages.some((message) => message.id === preview.id)) {
      return;
    }
    let highestConfirmed = 0;
    for (const message of messages) {
      if (!isOptimisticSeq(message.seq) && message.seq > highestConfirmed) {
        highestConfirmed = message.seq;
      }
    }
    if (previewSeq <= highestConfirmed) {
      return;
    }
    void reconcileMessagesThroughSeq(queryClient, tenantId, conversationId, previewSeq);
  }, [
    conversation?.last_message,
    conversation?.message_seq,
    conversationId,
    messages,
    queryClient,
    tenantId,
  ]);

  useEffect(() => {
    if (lastSeq == null || lastSeq <= lastMarkedSeqRef.current) {
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const timer = window.setTimeout(() => {
      if (lastSeq <= lastMarkedSeqRef.current) {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      lastMarkedSeqRef.current = lastSeq;
      markRead.mutate({ id: conversationId, upToSeq: lastSeq });
      markDelivered.mutate({ id: conversationId, upToSeq: lastSeq });
    }, 400);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastSeq]);

  const handleTyping = useCallback(() => {
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      sendTypingRef.current({ id: conversationId, isTyping: true });
    }
    if (typingIdleTimerRef.current != null) {
      window.clearTimeout(typingIdleTimerRef.current);
    }
    typingIdleTimerRef.current = window.setTimeout(() => {
      typingActiveRef.current = false;
      sendTypingRef.current({ id: conversationId, isTyping: false });
      typingIdleTimerRef.current = null;
    }, 2500);
  }, [conversationId]);

  useEffect(() => {
    typingActiveRef.current = false;
    return () => {
      if (typingIdleTimerRef.current != null) {
        window.clearTimeout(typingIdleTimerRef.current);
        typingIdleTimerRef.current = null;
      }
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        sendTypingRef.current({ id: conversationId, isTyping: false });
      }
    };
  }, [conversationId]);

  const handleMessageUploaded = useCallback(
    (message: Message) => {
      const listKey = messageListQueryKey(conversationId, tenantId);
      queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, (current) =>
        upsertMessageInInfiniteData(current, message, message.client_message_id),
      );
      patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
        ...conversation,
        unread_count: 0,
        last_message_at: message.created_at,
        last_message: {
          id: message.id,
          sender_id: message.sender_id,
          body: message.body,
          kind: message.kind,
          created_at: message.created_at,
        },
        message_seq: message.seq,
      }));
    },
    [conversationId, queryClient, tenantId],
  );

  if (conversationLoading && !conversation) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <CommMessageSkeleton />
      </div>
    );
  }

  if (conversationError || !me || !conversation) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <CommEmptyState
          title="Conversation unavailable"
          message="This chat may have been removed or you may not have access."
        />
      </div>
    );
  }

  const title = conversationLabel(conversation, me.id, userNames);
  const typingLabel =
    typingUsers.length > 0
      ? `${typingUsers.map((id) => userNames.get(id) ?? "Someone").join(", ")} typing…`
      : null;

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) {
      return;
    }

    if (actions.editingMessage) {
      const ok = await submitEdit(actions.editingMessage, body);
      if (ok) {
        setDraft("");
        actions.clearEdit();
      }
      return;
    }

    const clientMessageId = randomUuid();
    const payload = {
      body,
      kind: "TEXT" as const,
      client_message_id: clientMessageId,
      reply_to_message_id: actions.replyTo?.id ?? null,
    };
    setDraft("");
    actions.clearReply();
    try {
      await sendMessage.mutateAsync(payload);
    } catch (error) {
      if (isRetriableSendError(error)) {
        await enqueuePendingMessage({
          id: clientMessageId,
          tenantId,
          userId: me.id,
          conversationId,
          payload,
          createdAt: new Date().toISOString(),
          attempts: 0,
        });
        setFailedClientIds((current) => new Set(current).add(clientMessageId));
        toast.error("Failed to send message. It will retry when you are back online.");
        return;
      }
      const listKey = messageListQueryKey(conversationId, tenantId);
      queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.filter((row) => row.client_message_id !== clientMessageId),
          })),
        };
      });
      toast.error("Could not send message. Please check your input and try again.");
    }
  };

  const startCall = async (kind: "AUDIO" | "VIDEO") => {
    if (activeCall) {
      toast.message("You are already in a call");
      return;
    }
    try {
      const call = await createCall.mutateAsync({ conversation_id: conversationId, kind });
      if (!call.rtc_token) {
        toast.error("Video calls require Agora App ID and certificate on the backend");
        return;
      }
      beginCall?.(call);
    } catch {
      toast.error("Could not start call");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <CommForwardDialog
        open={forwardMessage != null}
        onOpenChange={(open) => {
          if (!open) {
            setForwardMessage(null);
          }
        }}
        message={forwardMessage}
        excludeConversationId={conversationId}
        onForward={async (message, targetId) => actions.forward(message, targetId)}
      />
      <ActiveCallJoinBanner conversationId={conversationId} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatWindow
        conversation={conversation}
        title={title}
        subtitle={typingLabel ?? undefined}
        presenceStatus={peerPresence?.status}
        lastSeen={peerPresence?.last_seen_at}
        messages={messages}
        currentUserId={me.id}
        userNames={userNames}
        peerReadSeq={peerReadSeq}
        peerDeliveredSeq={peerDeliveredSeq}
        firstUnreadSeq={firstUnreadSeq}
        isLoadingMessages={isLoading}
        hasMoreMessages={Boolean(hasNextPage)}
        isFetchingMoreMessages={isFetchingNextPage}
        onLoadMoreMessages={() => void fetchNextPage()}
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void handleSend()}
        onTyping={handleTyping}
        onMessageUploaded={handleMessageUploaded}
        replyTo={actions.replyTo}
        onReply={actions.reply}
        onClearReply={actions.clearReply}
        isSending={sendMessage.isPending}
        detailOpen={detailOpen}
        onToggleDetail={onToggleDetail}
        onStartCall={activeCall ? undefined : (kind) => void startCall(kind)}
        scrollToSeq={scrollToSeq}
        failedClientIds={failedClientIds}
        messageActions={actions}
      />
      </div>
    </div>
  );
}
