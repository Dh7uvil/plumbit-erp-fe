import { Suspense } from "react";

import { ChatScreenContainer } from "@/modules/communication/conversations/components/chat-screen-container";
import { CommChatLayoutSkeleton } from "@/modules/communication/components/ui";
import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ChatPage() {
  return (
    <Suspense fallback={<CommChatLayoutSkeleton />}>
      <PermissionGate permission={conversationPermissions.read}>
        <ChatScreenContainer />
      </PermissionGate>
    </Suspense>
  );
}
