"use client";

import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConversations } from "@/modules/communication/conversations/queries";
import { CommListItem } from "@/modules/communication/components/ui/comm-list-item";
import { conversationInitials, conversationLabel } from "@/modules/communication/shared/conversation-label";
import { buildConversationUserNames, useUserDirectory } from "@/modules/communication/shared/use-user-directory";
import type { Message } from "@/modules/communication/messages/schemas";
import { useMe } from "@/modules/users-management/auth/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";

export function CommForwardDialog({
  open,
  onOpenChange,
  message,
  onForward,
  excludeConversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  onForward: (message: Message, targetConversationId: string) => Promise<void>;
  excludeConversationId?: string;
}) {
  const { data: me } = useMe();
  const { byId } = useUserDirectory();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const { data, isLoading } = useConversations({ page_size: 100, sort_by: "last_message_at", sort_order: "desc" });

  const userNames = useMemo(() => buildConversationUserNames(byId, me), [byId, me]);

  const conversations = useMemo(() => {
    const items = (data?.data ?? []).filter((c) => c.id !== excludeConversationId);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return items;
    }
    return items.filter((conversation) => {
      const label = me
        ? conversationLabel(conversation, me.id, userNames).toLowerCase()
        : "";
      return label.includes(trimmed);
    });
  }, [data?.data, excludeConversationId, me, query, userNames]);

  const handleSelect = async (conversationId: string) => {
    if (!message || pending) {
      return;
    }
    setPending(true);
    try {
      await onForward(message, conversationId);
      onOpenChange(false);
      setQuery("");
      toast.success("Message forwarded");
    } catch {
      toast.error("Could not forward message");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations…"
            className="pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No conversations found.</p>
          ) : (
            <div className="space-y-1 py-1">
              {conversations.map((conversation) => {
                const label = me
                  ? conversationLabel(conversation, me.id, userNames)
                  : "Conversation";
                return (
                  <CommListItem
                    key={conversation.id}
                    title={label}
                    avatarLabel={conversationInitials(label)}
                    onClick={() => void handleSelect(conversation.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
        {pending ? (
          <p className="text-muted-foreground text-center text-xs">Forwarding…</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
