import { Suspense } from "react";

import { MeetingsScreen } from "@/modules/communication/meetings/components/meetings-screen";
import { CommListSkeleton } from "@/modules/communication/components/ui";
import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function MeetingsPage() {
  return (
    <Suspense fallback={<CommListSkeleton count={8} />}>
      <PermissionGate permission={conversationPermissions.read}>
        <MeetingsScreen />
      </PermissionGate>
    </Suspense>
  );
}
