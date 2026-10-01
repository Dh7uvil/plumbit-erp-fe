"use client";

import { MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CommEmptyState,
  CommErrorState,
  CommListItem,
  CommListSkeleton,
  CommSectionHeader,
} from "@/modules/communication/components/ui";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import { formatConversationTime } from "@/modules/communication/components/ui/comm-time";
import { GlobalSearchTrigger } from "@/modules/communication/components/GlobalSearchDialog";
import { NewConversationDialog } from "@/modules/communication/conversations/components/new-conversation-dialog";
import { useConversations } from "@/modules/communication/conversations/queries";
import type { Conversation } from "@/modules/communication/conversations/schemas";
import {
  conversationInitials,
  conversationLabel,
} from "@/modules/communication/shared/conversation-label";
import {
  buildConversationUserNames,
  useUserDirectory,
} from "@/modules/communication/shared/use-user-directory";
import { useMe } from "@/modules/users-management/auth/queries";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/api/errors";

type FilterMode = "all" | "unread" | "groups";

function conversationPreview(conversation: Conversation, currentUserId?: string): string {
  const last = conversation.last_message;
  if (last?.body?.trim()) {
    const prefix =
      last.sender_id && last.sender_id === currentUserId ? "You: " : "";
    return `${prefix}${last.body.trim()}`;
  }
  if (last?.kind === "ATTACHMENT") {
    return last.sender_id === currentUserId ? "You: Attachment" : "Attachment";
  }
  if (conversation.unread_count > 0) {
    return `${conversation.unread_count} unread message${conversation.unread_count === 1 ? "" : "s"}`;
  }
  if (conversation.kind === "GROUP") {
    return conversation.description?.trim() || `${conversation.participants.length} members`;
  }
  return "Direct message";
}

function ConversationSection({
  title,
  conversations,
  activeId,
  currentUserId,
  userNames,
  onCreate,
  createLabel,
}: {
  title: string;
  conversations: Conversation[];
  activeId?: string;
  currentUserId: string;
  userNames: Map<string, string>;
  onCreate: () => void;
  createLabel: string;
}) {
  return (
    <div>
      <CommSectionHeader
        title={title}
        action={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCreate}
            aria-label={createLabel}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        }
      />
      <div className="space-y-0.5 px-2 pb-2">
        {conversations.length === 0 ? (
          <CommEmptyState
            title={`No ${title.toLowerCase()} yet`}
            message="Start a new conversation using the button above."
            className="py-8"
          />
        ) : (
          conversations.map((conversation) => {
            const label = conversationLabel(conversation, currentUserId, userNames);
            return (
              <CommListItem
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                title={label}
                preview={conversationPreview(conversation, currentUserId)}
                time={formatConversationTime(conversation.last_message_at)}
                unreadCount={conversation.unread_count}
                avatarLabel={conversationInitials(label)}
                isActive={conversation.id === activeId}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export function ConversationListPanel({ activeConversationId }: { activeConversationId?: string }) {
  const { data: me } = useMe();
  const { byId } = useUserDirectory();
  const { data, isLoading, isError, error, refetch } = useConversations({
    page_size: 100,
    sort_by: "last_message_at",
    sort_order: "desc",
  });
  const [dialogKind, setDialogKind] = useState<"DIRECT" | "GROUP" | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  const userNames = useMemo(() => buildConversationUserNames(byId, me), [byId, me]);

  const conversations = data?.data ?? [];
  const filtered = useMemo(() => {
    if (filter === "unread") {
      return conversations.filter((c) => c.unread_count > 0);
    }
    if (filter === "groups") {
      return conversations.filter((c) => c.kind === "GROUP");
    }
    return conversations;
  }, [conversations, filter]);

  const direct = filtered.filter((c) => c.kind === "DIRECT");
  const groups = filtered.filter((c) => c.kind === "GROUP");

  if (!me) {
    return null;
  }

  const filters: { id: FilterMode; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "groups", label: "Groups" },
  ];

  return (
    <div className={cn("border-border/60 flex h-full flex-col border-r", commTheme.sidebar)}>
      <div className="border-border/60 space-y-3 border-b px-4 py-3">
        <h2 className="text-lg font-normal tracking-tight">Chat</h2>
        <GlobalSearchTrigger
          variant="outline"
          className="h-9 w-full justify-start px-3 font-normal text-muted-foreground"
        />
        <div className="flex gap-1">
          {filters.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium",
                filter === item.id
                  ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
                  : "text-muted-foreground hover:bg-[#f1f3f4]",
              )}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <CommListSkeleton count={8} />
        ) : isError ? (
          <div className="p-4">
            <CommErrorState
              message={getErrorMessage(error)}
              onRetry={() => void refetch()}
            />
          </div>
        ) : filter === "groups" ? (
          <ConversationSection
            title="Groups"
            conversations={groups}
            activeId={activeConversationId}
            currentUserId={me.id}
            userNames={userNames}
            onCreate={() => setDialogKind("GROUP")}
            createLabel="New group"
          />
        ) : filter === "unread" && filtered.length === 0 ? (
          <CommEmptyState
            title="All caught up"
            message="You have no unread conversations."
            className="py-12"
          />
        ) : (
          <>
            <ConversationSection
              title="Direct Messages"
              conversations={direct}
              activeId={activeConversationId}
              currentUserId={me.id}
              userNames={userNames}
              onCreate={() => setDialogKind("DIRECT")}
              createLabel="New direct message"
            />
            {filter === "all" ? (
              <ConversationSection
                title="Groups"
                conversations={groups}
                activeId={activeConversationId}
                currentUserId={me.id}
                userNames={userNames}
                onCreate={() => setDialogKind("GROUP")}
                createLabel="New group"
              />
            ) : null}
          </>
        )}
      </div>

      <NewConversationDialog
        kind={dialogKind}
        open={dialogKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogKind(null);
          }
        }}
      />
    </div>
  );
}
