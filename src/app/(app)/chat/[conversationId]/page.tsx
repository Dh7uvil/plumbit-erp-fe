import { Suspense } from "react";

import { ChatScreenContainer } from "@/modules/communication/conversations/components/chat-screen-container";
import { CommChatLayoutSkeleton } from "@/modules/communication/components/ui";
import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

async function ChatConversationBody({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <PermissionGate permission={conversationPermissions.read}>
      <ChatScreenContainer conversationId={conversationId} />
    </PermissionGate>
  );
}

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  return (
    <Suspense fallback={<CommChatLayoutSkeleton />}>
      <ChatConversationBody params={params} />
    </Suspense>
  );
}
