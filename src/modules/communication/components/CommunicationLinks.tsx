"use client";

import { Loader2, MessageCircle, Phone, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useBeginCall } from "@/modules/communication/calls/call-session-context";
import { useCreateCall } from "@/modules/communication/calls/mutations";
import { useConversationForContext } from "@/modules/communication/conversations/mutations";
import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { useMe } from "@/modules/users-management/auth/queries";
import { can } from "@/shared/auth/permissions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export type CommunicationContextEntityType =
  | "CUSTOMER"
  | "SUPPLIER"
  | "TASK"
  | "SALES_ORDER"
  | "PURCHASE_ORDER";

export function CommunicationLinks({
  contextEntityType,
  contextEntityId,
  title = "Communication",
  conversationName,
  participantUserIds = [],
  compact = false,
}: {
  contextEntityType: CommunicationContextEntityType;
  contextEntityId: string;
  title?: string;
  conversationName?: string;
  participantUserIds?: string[];
  compact?: boolean;
}) {
  const router = useRouter();
  const { data: me } = useMe();
  const forContext = useConversationForContext();
  const createCall = useCreateCall();
  const beginCall = useBeginCall();
  const [conversationId, setConversationId] = useState<string | null>(null);

  const canUseCommunication = Boolean(
    me && can(conversationPermissions.create, me.permissions ?? []),
  );

  if (!canUseCommunication) {
    return null;
  }

  const ensureConversation = async () => {
    if (conversationId) {
      return conversationId;
    }
    const conversation = await forContext.mutateAsync({
      context_entity_type: contextEntityType,
      context_entity_id: contextEntityId,
      participant_user_ids: participantUserIds,
      name: conversationName,
    });
    setConversationId(conversation.id);
    return conversation.id;
  };

  const openChat = async () => {
    try {
      const id = await ensureConversation();
      router.push(`/chat/${id}`);
    } catch {
      toast.error("Could not open conversation");
    }
  };

  const startCall = async (kind: "AUDIO" | "VIDEO") => {
    try {
      const id = await ensureConversation();
      const call = await createCall.mutateAsync({ conversation_id: id, kind });
      if (!call.rtc_token) {
        toast.error("Calls require Agora configuration on the backend");
        return;
      }
      beginCall?.(call);
      toast.success(`${kind === "VIDEO" ? "Video" : "Audio"} call started`);
    } catch {
      toast.error("Could not start call");
    }
  };

  const busy = forContext.isPending || createCall.isPending;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void openChat()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
          Chat
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Audio call"
          disabled={busy}
          onClick={() => void startCall("AUDIO")}
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Video call"
          disabled={busy}
          onClick={() => void startCall("VIDEO")}
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={busy} onClick={() => void openChat()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
          Open chat
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void startCall("AUDIO")}
        >
          <Phone className="mr-2 h-4 w-4" />
          Audio call
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void startCall("VIDEO")}
        >
          <Video className="mr-2 h-4 w-4" />
          Video call
        </Button>
        {conversationId ? (
          <Button type="button" variant="ghost" asChild>
            <Link href={`/chat/${conversationId}`}>Go to conversation</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
