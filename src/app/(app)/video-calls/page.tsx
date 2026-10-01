import { Suspense } from "react";

import { VideoCallsScreen } from "@/modules/communication/calls/components/video-calls-screen";
import { CommListSkeleton } from "@/modules/communication/components/ui";
import { callPermissions } from "@/modules/communication/calls/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function VideoCallsPage() {
  return (
    <Suspense fallback={<CommListSkeleton count={8} />}>
      <PermissionGate permission={callPermissions.read}>
        <VideoCallsScreen />
      </PermissionGate>
    </Suspense>
  );
}
