"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import {
  CommDateSeparator,
  CommEmptyState,
  CommMessageSkeleton,
  CommUnreadDivider,
  formatMessageDateLabel,
} from "@/modules/communication/components/ui";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import type { MessageActionHandlers } from "@/modules/communication/hooks/useMessageActions";
import { MessageBubble } from "@/modules/communication/messages/components/MessageBubble";
import type { MessageDeliveryStatus } from "@/modules/communication/components/ui/comm-message-status";
import type { Message } from "@/modules/communication/messages/schemas";
import { cn } from "@/shared/lib/cn";

type ListItem =
  | { type: "date"; id: string; label: string }
  | { type: "unread"; id: string }
  | { type: "message"; id: string; message: Message };

export type MessageListHandle = {
  scrollToSeq: (seq: number) => void;
};

function buildListItems(
  messages: Message[],
  firstUnreadSeq: number | null,
): ListItem[] {
  const items: ListItem[] = [];
  let lastDateLabel: string | null = null;
  let unreadInserted = firstUnreadSeq == null;

  for (const message of messages) {
    const dateLabel = formatMessageDateLabel(message.created_at);
    if (dateLabel !== lastDateLabel) {
      items.push({ type: "date", id: `date-${dateLabel}`, label: dateLabel });
      lastDateLabel = dateLabel;
    }
    if (!unreadInserted && firstUnreadSeq != null && message.seq >= firstUnreadSeq) {
      items.push({ type: "unread", id: "unread-divider" });
      unreadInserted = true;
    }
    items.push({ type: "message", id: message.id, message });
  }

  return items;
}

export const MessageList = forwardRef<
  MessageListHandle,
  {
    messages: Message[];
    currentUserId: string;
    userNames: Map<string, string>;
    peerReadSeq: number;
    peerDeliveredSeq: number;
    firstUnreadSeq?: number | null;
    isLoading: boolean;
    hasMore: boolean;
    isFetchingMore: boolean;
    onLoadMore: () => void;
    onReply?: (message: Message) => void;
    messageActions?: MessageActionHandlers;
    highlightSeq?: number | null;
    failedClientIds?: Set<string>;
    isGroup?: boolean;
  }
>(function MessageList(
  {
    messages,
    currentUserId,
    userNames,
    peerReadSeq,
    peerDeliveredSeq,
    firstUnreadSeq = null,
    isLoading,
    hasMore,
    isFetchingMore,
    onLoadMore,
    onReply,
    messageActions,
    highlightSeq,
    failedClientIds,
    isGroup = false,
  },
  ref,
) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastListLengthRef = useRef(0);
  const [firstItemIndex, setFirstItemIndex] = useState(10_000);
  const prevListHeadIdRef = useRef<string | null>(null);

  const listItems = useMemo(
    () => buildListItems(messages, firstUnreadSeq),
    [messages, firstUnreadSeq],
  );

  const replyPreviewLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const message of messages) {
      if (message.reply_preview?.sender_id) {
        map.set(
          message.reply_preview.id,
          userNames.get(message.reply_preview.sender_id) ?? "User",
        );
      }
    }
    return map;
  }, [messages, userNames]);

  const deliveryStatusFor = (message: Message): MessageDeliveryStatus | undefined => {
    if (message.sender_id !== currentUserId) {
      return undefined;
    }
    if (message.client_message_id && failedClientIds?.has(message.client_message_id)) {
      return "failed";
    }
    if (peerReadSeq >= message.seq) {
      return "read";
    }
    if (peerDeliveredSeq >= message.seq) {
      return "delivered";
    }
    return "sent";
  };

  useImperativeHandle(ref, () => ({
    scrollToSeq: (seq: number) => {
      const index = listItems.findIndex(
        (item) => item.type === "message" && item.message.seq === seq,
      );
      if (index >= 0) {
        virtuosoRef.current?.scrollToIndex({ index, align: "center", behavior: "smooth" });
        const item = listItems[index];
        if (item.type === "message") {
          setHighlightedId(item.message.id);
          window.setTimeout(() => setHighlightedId(null), 2000);
        }
      }
    },
  }));

  const listHeadId = listItems[0]?.id ?? null;
  const listLength = listItems.length;

  useEffect(() => {
    if (
      prevListHeadIdRef.current &&
      listHeadId &&
      listHeadId !== prevListHeadIdRef.current &&
      listLength > lastListLengthRef.current
    ) {
      setFirstItemIndex((value) => value - (listLength - lastListLengthRef.current));
    }
    prevListHeadIdRef.current = listHeadId;
  }, [listHeadId, listLength]);

  useEffect(() => {
    if (listItems.length <= lastListLengthRef.current) {
      lastListLengthRef.current = listItems.length;
      return;
    }
    lastListLengthRef.current = listItems.length;
    if (!atBottom) {
      return;
    }
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: listItems.length - 1,
        align: "end",
        behavior: "auto",
      });
    });
  }, [atBottom, listItems.length]);

  useEffect(() => {
    if (highlightSeq != null) {
      const index = listItems.findIndex(
        (item) => item.type === "message" && item.message.seq === highlightSeq,
      );
      if (index >= 0) {
        virtuosoRef.current?.scrollToIndex({ index, align: "center", behavior: "smooth" });
        const item = listItems[index];
        if (item.type === "message") {
          setHighlightedId(item.message.id);
          window.setTimeout(() => setHighlightedId(null), 2000);
        }
      }
    }
  }, [highlightSeq, listItems]);

  const chatBackgroundClass = commTheme.chatBackground;

  if (isLoading && messages.length === 0) {
    return (
      <div className={cn("min-h-0 flex-1", chatBackgroundClass)}>
        <CommMessageSkeleton />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn("flex flex-1 items-center justify-center", chatBackgroundClass)}>
        <CommEmptyState
          title="No messages yet"
          message="Send a message to start the conversation."
        />
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", chatBackgroundClass)}>
      {isFetchingMore ? (
        <p className="text-muted-foreground shrink-0 px-4 py-2 text-center text-xs">
          Loading older messages…
        </p>
      ) : null}
      <Virtuoso
        ref={virtuosoRef}
        className="min-h-0 flex-1"
        style={{ height: "100%", minHeight: 0 }}
        data={listItems}
        firstItemIndex={firstItemIndex}
        computeItemKey={(_index, item) => item.id}
        alignToBottom
        atBottomThreshold={160}
        atBottomStateChange={setAtBottom}
        followOutput={(isAtBottom) => (isAtBottom ? "auto" : false)}
        increaseViewportBy={{ top: 80, bottom: 120 }}
        initialTopMostItemIndex={Math.max(0, listItems.length - 1)}
        components={{
          Footer: () => <div className="h-2 shrink-0" aria-hidden />,
        }}
        startReached={() => {
          if (hasMore && !isFetchingMore) {
            onLoadMore();
          }
        }}
        itemContent={(_index, item) => {
          if (item.type === "date") {
            return <CommDateSeparator label={item.label} />;
          }
          if (item.type === "unread") {
            return <CommUnreadDivider />;
          }
          const message = item.message;
          return (
            <div
              key={message.id}
              className={cn(
                "overflow-visible px-3 py-0.5 sm:px-4",
                highlightedId === message.id && "bg-primary/15 rounded-lg",
              )}
            >
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
                currentUserId={currentUserId}
                senderName={
                  message.sender_id ? (userNames.get(message.sender_id) ?? "User") : "You"
                }
                deliveryStatus={deliveryStatusFor(message)}
                replyPreviewLabel={
                  message.reply_preview
                    ? replyPreviewLabels.get(message.reply_preview.id)
                    : null
                }
                onReply={onReply}
                messageActions={messageActions}
                showAvatar={isGroup && message.sender_id !== currentUserId}
              />
            </div>
          );
        }}
      />
    </div>
  );
});
