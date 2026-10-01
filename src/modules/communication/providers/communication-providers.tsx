"use client";

import type { ReactNode } from "react";

import { CallProvider } from "@/modules/communication/calls/components/call-provider";
import { usePresenceHeartbeat } from "@/modules/communication/hooks/usePresence";
import { RealtimeProvider } from "@/modules/communication/realtime/realtime-provider";
import { useTabTitleUnread } from "@/modules/communication/shared/use-tab-title-unread";

function CommunicationChrome({ children }: { children: ReactNode }) {
  usePresenceHeartbeat();
  useTabTitleUnread();
  return children;
}

export function CommunicationProviders({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <CommunicationChrome>
        <CallProvider>{children}</CallProvider>
      </CommunicationChrome>
    </RealtimeProvider>
  );
}
