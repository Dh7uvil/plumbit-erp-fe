"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { searchApi } from "@/modules/communication/search/api";
import type { ConversationMessageSearchParams, SearchParams } from "@/modules/communication/search/schemas";
import { communicationQueryKey } from "@/modules/communication/shared/tenant-query";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

export const searchKeys = {
  all: ["communication", "search"] as const,
  global: (params: SearchParams) => [...searchKeys.all, "global", params] as const,
  conversation: (conversationId: string, params: ConversationMessageSearchParams) =>
    [...searchKeys.all, "conversation", conversationId, params] as const,
};

export function useGlobalSearch(params: SearchParams | null) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: communicationQueryKey(searchKeys.global(params ?? { q: "", type: "messages" }), tenantId),
    queryFn: () => searchApi.search(params!),
    enabled: Boolean(params?.q.trim()),
    placeholderData: keepPreviousData,
  });
}

export function useConversationMessageSearch(
  conversationId: string | null,
  params: ConversationMessageSearchParams | null,
) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: communicationQueryKey(
      searchKeys.conversation(conversationId ?? "", params ?? { q: "" }),
      tenantId,
    ),
    queryFn: () => searchApi.searchConversationMessages(conversationId!, params!),
    enabled: Boolean(conversationId && params?.q.trim()),
    placeholderData: keepPreviousData,
  });
}
