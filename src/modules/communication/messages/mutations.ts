"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationsApi } from "@/modules/communication/conversations/api";
import { messagesApi } from "@/modules/communication/messages/api";
import {
  appendMessageToInfiniteData,
  nextOptimisticSeq,
  upsertMessageInInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import { messageKeys } from "@/modules/communication/messages/queries";
import type {
  Message,
  MessageCreateRequest,
  MessageForwardRequest,
  MessageListPage,
  MessageUpdateRequest,
} from "@/modules/communication/messages/schemas";
import { toLastMessagePreview } from "@/modules/communication/shared/last-message-preview";
import {
  communicationQueryKey,
  messageListQueryKey,
  patchConversationCaches,
  patchParticipantDeliveredSeq,
} from "@/modules/communication/shared/tenant-query";
import { useMe } from "@/modules/users-management/auth/queries";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";
import { isRetriableSendError } from "@/modules/communication/messages/send-error";
import { randomUuid } from "@/shared/lib/uuid";

export { isRetriableSendError };

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { data: me } = useMe();
  const listKey = messageListQueryKey(conversationId, tenantId);

  return useMutation({
    mutationFn: (values: MessageCreateRequest) => messagesApi.create(conversationId, values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey);
      const optimistic: Message = {
        id: values.client_message_id ?? randomUuid(),
        conversation_id: conversationId,
        seq: nextOptimisticSeq(previous),
        sender_id: me?.id ?? null,
        kind: values.kind ?? "TEXT",
        body: values.body,
        reply_to_message_id: values.reply_to_message_id ?? null,
        client_message_id: values.client_message_id ?? null,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<MessageListPage>>(
        listKey,
        appendMessageToInfiniteData(previous, optimistic),
      );
      return { listKey, clientMessageId: values.client_message_id ?? null };
    },
    onSuccess: (serverMessage, values, context) => {
      if (!context?.listKey) {
        return;
      }
      queryClient.setQueryData<InfiniteData<MessageListPage>>(context.listKey, (current) =>
        upsertMessageInInfiniteData(current, serverMessage, values.client_message_id),
      );
      patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
        ...conversation,
        unread_count: 0,
        last_message_at: serverMessage.created_at,
        last_message: toLastMessagePreview(serverMessage),
        message_seq: serverMessage.seq,
      }));
      void queryClient.refetchQueries({ queryKey: context.listKey, type: "active" });
    },
    onError: () => {
      // Keep optimistic row in cache; caller marks failed via client_message_id.
    },
  });
}

export function useSendAttachmentMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const listKey = messageListQueryKey(conversationId, tenantId);

  return useMutation({
    mutationFn: ({ file, clientMessageId }: { file: File; clientMessageId?: string }) =>
      messagesApi.createAttachment(conversationId, file, clientMessageId),
    onSuccess: (serverMessage) => {
      queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, (current) =>
        upsertMessageInInfiniteData(current, serverMessage, serverMessage.client_message_id),
      );
      patchConversationCaches(queryClient, tenantId, conversationId, (conversation) => ({
        ...conversation,
        unread_count: 0,
        last_message_at: serverMessage.created_at,
        last_message: toLastMessagePreview(serverMessage),
        message_seq: serverMessage.seq,
      }));
    },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: ({ id, upToSeq }: { id: string; upToSeq: number }) =>
      messagesApi.markDelivered(id, { up_to_seq: upToSeq }),
    onMutate: ({ id, upToSeq }) => {
      if (me?.id) {
        patchParticipantDeliveredSeq(queryClient, tenantId, id, me.id, upToSeq);
      }
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MessageUpdateRequest }) =>
      messagesApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: (id: string) => messagesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesApi.addReaction(messageId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesApi.removeReaction(messageId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useSaveMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.save(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useUnsaveMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.unsave(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageBaseKey }),
  });
}

export function useForwardMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({
      messageId,
      values,
    }: {
      messageId: string;
      values: MessageForwardRequest;
    }) => messagesApi.forward(messageId, values),
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({ queryKey: messageBaseKey });
      queryClient.invalidateQueries({
        queryKey: messageListQueryKey(variables.values.conversation_id, tenantId),
      });
    },
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => conversationsApi.pinMessage(conversationId, messageId),
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({ queryKey: messageBaseKey });
      queryClient.invalidateQueries({
        queryKey: messageListQueryKey(variables.conversationId, tenantId),
      });
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const messageBaseKey = communicationQueryKey(messageKeys.all, tenantId);
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => conversationsApi.unpinMessage(conversationId, messageId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: messageBaseKey });
      queryClient.invalidateQueries({
        queryKey: messageListQueryKey(variables.conversationId, tenantId),
      });
    },
  });
}

