"use client";

import { useMemo } from "react";

import { useCalls } from "@/modules/communication/calls/queries";
import type { Call } from "@/modules/communication/calls/schemas";
import { useMe } from "@/modules/users-management/auth/queries";

export function useActiveConversationCall(conversationId: string | null): Call | null {
  const { data: me } = useMe();
  const { data } = useCalls({
    conversation_id: conversationId ?? undefined,
    status: "ACTIVE",
    page_size: 5,
  });

  return useMemo(() => {
    if (!conversationId || !me) {
      return null;
    }
    const calls = data?.data ?? [];
    return (
      calls.find((call) => {
        if (call.scope !== "GROUP") {
          return false;
        }
        const self = call.participants.find((participant) => participant.user_id === me.id);
        return self?.status !== "JOINED";
      }) ?? null
    );
  }, [conversationId, data?.data, me]);
}
