"use client";

import { ArrowLeft, Info, Phone, Video } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { CommAvatar, CommPresenceBadge } from "@/modules/communication/components/ui";
import type { Conversation } from "@/modules/communication/conversations/schemas";
import type { MessageActionHandlers } from "@/modules/communication/hooks/useMessageActions";
import { ConversationSearch } from "@/modules/communication/messages/components/ConversationSearch";
import { MessageComposer } from "@/modules/communication/messages/components/MessageComposer";
import {
  MessageList,
  type MessageListHandle,
} from "@/modules/communication/messages/components/MessageList";
import type { Message } from "@/modules/communication/messages/schemas";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export function ChatWindow({
  conversation,
  title,
  subtitle,
  presenceStatus,
  lastSeen,
  messages,
  currentUserId,
  userNames,
  peerReadSeq,
  peerDeliveredSeq,
  firstUnreadSeq,
  isLoadingMessages,
  hasMoreMessages,
  isFetchingMoreMessages,
  onLoadMoreMessages,
  draft,
  onDraftChange,
  onSend,
  onTyping,
  onMessageUploaded,
  replyTo,
  onReply,
  onClearReply,
  isSending,
  isUploading,
  detailOpen,
  onToggleDetail,
  onStartCall,
  onSelectSearchMessage,
  scrollToSeq,
  failedClientIds,
  messageActions,
}: {
  conversation: Conversation;
  title: string;
  subtitle?: string;
  presenceStatus?: string;
  lastSeen?: string | null;
  messages: Message[];
  currentUserId: string;
  userNames: Map<string, string>;
  peerReadSeq: number;
  peerDeliveredSeq: number;
  firstUnreadSeq?: number | null;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  isFetchingMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onMessageUploaded?: (message: Message) => void;
  replyTo?: Message | null;
  onReply?: (message: Message) => void;
  onClearReply?: () => void;
  isSending?: boolean;
  isUploading?: boolean;
  detailOpen?: boolean;
  onToggleDetail?: () => void;
  onStartCall?: (kind: "AUDIO" | "VIDEO") => void;
  onSelectSearchMessage?: (seq: number) => void;
  scrollToSeq?: number;
  failedClientIds?: Set<string>;
  messageActions?: MessageActionHandlers;
}) {
  const messageListRef = useRef<MessageListHandle>(null);

  const handleSelectSearchMessage = (seq: number) => {
    messageListRef.current?.scrollToSeq(seq);
    onSelectSearchMessage?.(seq);
  };

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border/60 bg-white relative z-10 flex shrink-0 items-center justify-between border-b px-3 py-2.5 md:px-4 dark:bg-background">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            asChild
            aria-label="Back to chats"
          >
            <Link href="/chat">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          {onToggleDetail ? (
            <button
              type="button"
              onClick={onToggleDetail}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors",
                "hover:bg-[#f1f3f4] focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                detailOpen && "bg-[#e8f0fe]",
              )}
              aria-label="Conversation info"
              aria-expanded={detailOpen}
            >
              <CommAvatar label={title} presence={presenceStatus} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{title}</p>
                {subtitle ? (
                  <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
                ) : conversation.kind === "DIRECT" && presenceStatus ? (
                  <CommPresenceBadge status={presenceStatus} lastSeen={lastSeen} />
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {conversation.kind === "GROUP"
                      ? `${conversation.participants.length} members`
                      : "Direct message"}
                  </p>
                )}
              </div>
            </button>
          ) : (
            <>
              <CommAvatar label={title} presence={presenceStatus} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{title}</p>
                {subtitle ? (
                  <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
                ) : conversation.kind === "DIRECT" && presenceStatus ? (
                  <CommPresenceBadge status={presenceStatus} lastSeen={lastSeen} />
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {conversation.kind === "GROUP"
                      ? `${conversation.participants.length} members`
                      : "Direct message"}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ConversationSearch
            conversationId={conversation.id}
            onSelectMessage={handleSelectSearchMessage}
          />
          {onStartCall ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall("AUDIO")}
                    aria-label="Audio call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Audio call</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall("VIDEO")}
                    aria-label="Video call"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call</TooltipContent>
              </Tooltip>
            </>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={detailOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleDetail}
                aria-label={detailOpen ? "Close conversation info" : "Open conversation info"}
                aria-pressed={detailOpen}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{detailOpen ? "Close info" : "Conversation info"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <MessageList
        ref={messageListRef}
        messages={messages}
        currentUserId={currentUserId}
        userNames={userNames}
        peerReadSeq={peerReadSeq}
        peerDeliveredSeq={peerDeliveredSeq}
        firstUnreadSeq={firstUnreadSeq}
        isLoading={isLoadingMessages}
        hasMore={hasMoreMessages}
        isFetchingMore={isFetchingMoreMessages}
        onLoadMore={onLoadMoreMessages}
        onReply={onReply}
        messageActions={messageActions}
        highlightSeq={scrollToSeq}
        failedClientIds={failedClientIds}
        isGroup={conversation.kind === "GROUP"}
      />

      <MessageComposer
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
        onTyping={onTyping}
        onMessageUploaded={onMessageUploaded}
        replyTo={replyTo}
        onClearReply={onClearReply}
        isSending={isSending}
        isUploading={isUploading}
        conversationId={conversation.id}
      />
    </div>
  );
}
