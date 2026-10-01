"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useAddReaction,
  useDeleteMessage,
  useForwardMessage,
  usePinMessage,
  useRemoveReaction,
  useSaveMessage,
  useUnpinMessage,
  useUnsaveMessage,
  useUpdateMessage,
} from "@/modules/communication/messages/mutations";
import type { Message } from "@/modules/communication/messages/schemas";
import { randomUuid } from "@/shared/lib/uuid";

export type MessageActionHandlers = {
  reply: (message: Message) => void;
  react: (message: Message, emoji: string) => Promise<void>;
  edit: (message: Message) => void;
  delete: (message: Message) => Promise<void>;
  forward: (message: Message, targetConversationId: string) => Promise<void>;
  pin: (message: Message) => Promise<void>;
  unpin: (message: Message) => Promise<void>;
  star: (message: Message) => Promise<void>;
  unstar: (message: Message) => Promise<void>;
  toggleStar: (message: Message) => Promise<void>;
  toggleReaction: (message: Message, emoji: string) => Promise<void>;
  replyTo: Message | null;
  clearReply: () => void;
  editingMessage: Message | null;
  clearEdit: () => void;
  savedMessageIds: ReadonlySet<string>;
  isPending: boolean;
  requestForward: (message: Message) => void;
};

export function useMessageActions({
  conversationId,
  currentUserId,
  onReply,
  onEdit,
  onRequestForward,
}: {
  conversationId: string;
  currentUserId?: string | null;
  onReply?: (message: Message | null) => void;
  onEdit?: (message: Message | null) => void;
  onRequestForward?: (message: Message) => void;
}): MessageActionHandlers {
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const forwardMessage = useForwardMessage();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const saveMessage = useSaveMessage();
  const unsaveMessage = useUnsaveMessage();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(() => new Set());

  const isPending =
    addReaction.isPending ||
    removeReaction.isPending ||
    updateMessage.isPending ||
    deleteMessage.isPending ||
    forwardMessage.isPending ||
    pinMessage.isPending ||
    unpinMessage.isPending ||
    saveMessage.isPending ||
    unsaveMessage.isPending;

  const clearReply = useCallback(() => {
    setReplyTo(null);
    onReply?.(null);
  }, [onReply]);

  const clearEdit = useCallback(() => {
    setEditingMessage(null);
    onEdit?.(null);
  }, [onEdit]);

  const reply = useCallback(
    (message: Message) => {
      setReplyTo(message);
      onReply?.(message);
    },
    [onReply],
  );

  const edit = useCallback(
    (message: Message) => {
      setEditingMessage(message);
      onEdit?.(message);
    },
    [onEdit],
  );

  const react = useCallback(
    async (message: Message, emoji: string) => {
      const reactedByMe = message.reactions?.some(
        (reaction) => reaction.emoji === emoji && reaction.user_id === currentUserId,
      );
      try {
        if (reactedByMe) {
          await removeReaction.mutateAsync({ messageId: message.id, emoji });
        } else {
          await addReaction.mutateAsync({ messageId: message.id, emoji });
        }
      } catch {
        toast.error("Could not update reaction");
      }
    },
    [addReaction, currentUserId, removeReaction],
  );

  const toggleReaction = react;

  const remove = useCallback(
    async (message: Message) => {
      try {
        await deleteMessage.mutateAsync(message.id);
        toast.success("Message deleted");
        if (replyTo?.id === message.id) {
          clearReply();
        }
        if (editingMessage?.id === message.id) {
          clearEdit();
        }
      } catch {
        toast.error("Could not delete message");
      }
    },
    [clearEdit, clearReply, deleteMessage, editingMessage?.id, replyTo?.id],
  );

  const forward = useCallback(
    async (message: Message, targetConversationId: string) => {
      try {
        await forwardMessage.mutateAsync({
          messageId: message.id,
          values: {
            conversation_id: targetConversationId,
            client_message_id: randomUuid(),
          },
        });
        toast.success("Message forwarded");
      } catch {
        toast.error("Could not forward message");
      }
    },
    [forwardMessage],
  );

  const pin = useCallback(
    async (message: Message) => {
      try {
        await pinMessage.mutateAsync({ conversationId, messageId: message.id });
        toast.success("Message pinned");
      } catch {
        toast.error("Could not pin message");
      }
    },
    [conversationId, pinMessage],
  );

  const unpin = useCallback(
    async (message: Message) => {
      try {
        await unpinMessage.mutateAsync({ conversationId, messageId: message.id });
        toast.success("Message unpinned");
      } catch {
        toast.error("Could not unpin message");
      }
    },
    [conversationId, unpinMessage],
  );

  const star = useCallback(
    async (message: Message) => {
      try {
        await saveMessage.mutateAsync(message.id);
        setSavedMessageIds((current) => new Set(current).add(message.id));
        toast.success("Message saved");
      } catch {
        toast.error("Could not save message");
      }
    },
    [saveMessage],
  );

  const unstar = useCallback(
    async (message: Message) => {
      try {
        await unsaveMessage.mutateAsync(message.id);
        setSavedMessageIds((current) => {
          const next = new Set(current);
          next.delete(message.id);
          return next;
        });
        toast.success("Message removed from saved");
      } catch {
        toast.error("Could not unsave message");
      }
    },
    [unsaveMessage],
  );

  const toggleStar = useCallback(
    async (message: Message) => {
      if (savedMessageIds.has(message.id)) {
        await unstar(message);
      } else {
        await star(message);
      }
    },
    [savedMessageIds, star, unstar],
  );

  return useMemo(
    () => ({
      reply,
      react,
      edit,
      delete: remove,
      forward,
      pin,
      unpin,
      star,
      unstar,
      toggleStar,
      toggleReaction,
      replyTo,
      clearReply,
      editingMessage,
      clearEdit,
      savedMessageIds,
      isPending,
      requestForward: (message: Message) => onRequestForward?.(message),
    }),
    [
      clearEdit,
      clearReply,
      edit,
      editingMessage,
      forward,
      isPending,
      onRequestForward,
      pin,
      react,
      remove,
      reply,
      replyTo,
      savedMessageIds,
      star,
      toggleReaction,
      toggleStar,
      unpin,
      unstar,
    ],
  );
}

export function useSubmitMessageEdit() {
  const updateMessage = useUpdateMessage();
  return useCallback(
    async (message: Message, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) {
        toast.error("Message cannot be empty");
        return false;
      }
      try {
        await updateMessage.mutateAsync({ id: message.id, values: { body: trimmed } });
        toast.success("Message updated");
        return true;
      } catch {
        toast.error("Could not update message");
        return false;
      }
    },
    [updateMessage],
  );
}
