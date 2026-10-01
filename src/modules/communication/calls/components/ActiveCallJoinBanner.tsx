"use client";

import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

import { useActiveCallSession, useBeginCall } from "@/modules/communication/calls/call-session-context";
import { useActiveConversationCall } from "@/modules/communication/calls/hooks/use-active-conversation-call";
import { useJoinCall } from "@/modules/communication/calls/mutations";
import { Button } from "@/shared/components/ui/button";

export function ActiveCallJoinBanner({ conversationId }: { conversationId: string }) {
  const activeCall = useActiveConversationCall(conversationId);
  const activeSession = useActiveCallSession();
  const joinCall = useJoinCall();
  const beginCall = useBeginCall();

  if (!activeCall || activeSession?.conversation_id === conversationId) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-primary/20 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        {activeCall.kind === "VIDEO" ? (
          <Video className="text-primary h-4 w-4" />
        ) : (
          <Phone className="text-primary h-4 w-4" />
        )}
        <span>
          {activeCall.kind === "VIDEO" ? "Video" : "Audio"} call in progress in this group
        </span>
      </div>
      <Button
        size="sm"
        disabled={joinCall.isPending}
        onClick={() => {
          joinCall.mutate(activeCall.id, {
            onSuccess: (call) => {
              if (!call.rtc_token) {
                toast.error("Could not join call — missing RTC token");
                return;
              }
              beginCall?.(call);
            },
            onError: () => toast.error("Could not join call"),
          });
        }}
      >
        Join call
      </Button>
    </div>
  );
}
