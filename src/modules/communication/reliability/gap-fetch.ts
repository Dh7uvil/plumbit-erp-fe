import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/modules/communication/messages/api";
import {
  getHighestConfirmedSeq,
  upsertMessageInInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import type { Message, MessageListPage } from "@/modules/communication/messages/schemas";
import { messageListQueryKey } from "@/modules/communication/shared/tenant-query";

const PAGE_LIMIT = 200;

export async function fetchMessagesAfterSeq(
  conversationId: string,
  afterSeq: number,
  limit = PAGE_LIMIT,
): Promise<Message[]> {
  const page = await messagesApi.list(conversationId, { after_seq: afterSeq, limit });
  return page.items.sort((a, b) => a.seq - b.seq);
}

export async function fetchAllMessagesAfterSeq(
  conversationId: string,
  afterSeq: number,
  targetSeq: number,
): Promise<Message[]> {
  const collected: Message[] = [];
  let cursor = afterSeq;
  while (cursor < targetSeq) {
    const batch = await fetchMessagesAfterSeq(conversationId, cursor, PAGE_LIMIT);
    if (batch.length === 0) {
      break;
    }
    collected.push(...batch);
    const highest = batch[batch.length - 1]?.seq ?? cursor;
    if (highest <= cursor) {
      break;
    }
    cursor = highest;
    if (batch.length < PAGE_LIMIT) {
      break;
    }
  }
  return collected;
}

export async function reconcileMessagesThroughSeq(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  throughSeq: number,
): Promise<void> {
  const listKey = messageListQueryKey(conversationId, tenantId);
  const current = queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey);
  const lastSeq = getHighestConfirmedSeq(current);
  if (throughSeq <= lastSeq) {
    return;
  }

  const rows = await fetchAllMessagesAfterSeq(conversationId, lastSeq, throughSeq);
  if (rows.length === 0) {
    await queryClient.refetchQueries({ queryKey: listKey, type: "active" });
    return;
  }

  queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, (existing) => {
    let next = existing;
    for (const message of rows) {
      next = upsertMessageInInfiniteData(next, message, message.client_message_id);
    }
    return next;
  });
}

export async function fillMessageGap(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  lastSeq: number,
  nextSeq: number,
): Promise<void> {
  if (nextSeq <= lastSeq + 1) {
    return;
  }

  const listKey = messageListQueryKey(conversationId, tenantId);
  const rows = await fetchAllMessagesAfterSeq(conversationId, lastSeq, nextSeq);
  if (rows.length === 0) {
    await queryClient.invalidateQueries({ queryKey: listKey });
    return;
  }

  queryClient.setQueryData<InfiniteData<MessageListPage>>(listKey, (current) => {
    let next = current;
    for (const message of rows) {
      next = upsertMessageInInfiniteData(next, message, message.client_message_id);
    }
    return next;
  });

  const highestAfter = getHighestConfirmedSeq(
    queryClient.getQueryData<InfiniteData<MessageListPage>>(listKey),
  );
  if (highestAfter < nextSeq - 1) {
    await queryClient.invalidateQueries({ queryKey: listKey, type: "active" });
  }
}
