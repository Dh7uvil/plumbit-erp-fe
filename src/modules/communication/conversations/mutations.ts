"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationsApi } from "@/modules/communication/conversations/api";
import { conversationKeys } from "@/modules/communication/conversations/queries";
import type {
  ConversationCreateRequest,
  ConversationForContextRequest,
  ConversationUpdateRequest,
  ParticipantAddRequest,
} from "@/modules/communication/conversations/schemas";
import {
  communicationQueryKey,
  invalidateConversationQueries,
  markConversationReadInCache,
  patchParticipantReadSeq,
} from "@/modules/communication/shared/tenant-query";
import { useMe } from "@/modules/users-management/auth/queries";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

function useInvalidateConversations() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return () => invalidateConversationQueries(queryClient, tenantId);
}

export function useCreateConversation() {
  const invalidate = useInvalidateConversations();
  return useMutation({
    mutationFn: (values: ConversationCreateRequest) => conversationsApi.create(values),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateConversation() {
  const invalidate = useInvalidateConversations();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ConversationUpdateRequest }) =>
      conversationsApi.update(id, values),
    onSuccess: () => invalidate(),
  });
}

export function useAddParticipant() {
  const invalidate = useInvalidateConversations();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ParticipantAddRequest }) =>
      conversationsApi.addParticipant(id, values),
    onSuccess: () => invalidate(),
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: ({ id, upToSeq }: { id: string; upToSeq: number }) =>
      conversationsApi.markRead(id, { up_to_seq: upToSeq }),
    onMutate: ({ id, upToSeq }) => {
      markConversationReadInCache(queryClient, tenantId, id);
      if (me?.id) {
        patchParticipantReadSeq(queryClient, tenantId, id, me.id, upToSeq);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationQueryKey(conversationKeys.unread(), tenantId),
      });
    },
  });
}

export function useSendTyping() {
  return useMutation({
    mutationFn: async ({ id, isTyping }: { id: string; isTyping: boolean }) => {
      const { sendTyping } = await import("@/modules/communication/realtime/transport");
      if (sendTyping(id, isTyping)) {
        return;
      }
      await conversationsApi.typing(id, isTyping);
    },
  });
}

export function useConversationForContext() {
  const invalidate = useInvalidateConversations();
  return useMutation({
    mutationFn: (values: ConversationForContextRequest) => conversationsApi.forContext(values),
    onSuccess: () => invalidate(),
  });
}
