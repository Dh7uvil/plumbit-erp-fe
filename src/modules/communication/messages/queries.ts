"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { messagesApi } from "@/modules/communication/messages/api";
import {
  flattenMessagePages,
  mergePendingIntoInfiniteData,
} from "@/modules/communication/messages/message-list-utils";
import type { MessageListPage } from "@/modules/communication/messages/schemas";
import { MESSAGE_PAGE_SIZE } from "@/modules/communication/messages/schemas";
import { getCommunicationPollIntervalMs } from "@/modules/communication/realtime/transport";
import { useRealtimeContext } from "@/modules/communication/realtime/realtime-provider";
import { messageListQueryKey } from "@/modules/communication/shared/tenant-query";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

export const messageKeys = {
  all: ["communication", "messages"] as const,
  infinite: (conversationId: string) =>
    [...messageKeys.all, "infinite", conversationId] as const,
};

export function useMessages(conversationId: string | null) {
  const tenantId = useTenantId();
  const { syncMode } = useRealtimeContext();

  const query = useInfiniteQuery({
    queryKey: messageListQueryKey(conversationId ?? "", tenantId),
    queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
      messagesApi.list(conversationId!, {
        before_seq: pageParam,
        limit: MESSAGE_PAGE_SIZE,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: MessageListPage) => {
      if (!lastPage.has_more || lastPage.items.length === 0) {
        return undefined;
      }
      return lastPage.items[0]!.seq;
    },
    enabled: Boolean(conversationId),
    refetchInterval: getCommunicationPollIntervalMs(syncMode),
    structuralSharing: (previous, next) =>
      mergePendingIntoInfiniteData(
        previous as InfiniteData<MessageListPage> | undefined,
        next as InfiniteData<MessageListPage>,
      ),
  });

  const messages = useMemo(() => flattenMessagePages(query.data), [query.data]);

  return {
    ...query,
    messages,
  };
}
