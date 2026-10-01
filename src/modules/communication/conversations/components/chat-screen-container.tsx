"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { ChatScreen } from "@/modules/communication/conversations/components/chat-screen";
import { useCreateConversation } from "@/modules/communication/conversations/mutations";

export function ChatScreenContainer({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createConversation = useCreateConversation();
  const handledUserRef = useRef<string | null>(null);

  const scrollToSeq = searchParams.get("seq");
  const userId = searchParams.get("user");

  useEffect(() => {
    if (!userId || conversationId || handledUserRef.current === userId) {
      return;
    }
    handledUserRef.current = userId;
    void (async () => {
      try {
        const conversation = await createConversation.mutateAsync({
          kind: "DIRECT",
          other_user_id: userId,
        });
        router.replace(`/chat/${conversation.id}`);
      } catch {
        toast.error("Could not open direct message");
        handledUserRef.current = null;
      }
    })();
  }, [conversationId, createConversation, router, userId]);

  return (
    <ChatScreen
      conversationId={conversationId}
      scrollToSeq={scrollToSeq ? Number.parseInt(scrollToSeq, 10) : undefined}
    />
  );
}
