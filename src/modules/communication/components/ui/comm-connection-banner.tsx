"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useRealtimeContext } from "@/modules/communication/realtime/realtime-provider";

const DISCONNECT_BANNER_DELAY_MS = 2_500;

export function CommConnectionBanner() {
  const { syncMode } = useRealtimeContext();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (syncMode !== "connecting") {
      setShowBanner(false);
      return;
    }

    const timer = window.setTimeout(() => setShowBanner(true), DISCONNECT_BANNER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [syncMode]);

  if (syncMode !== "connecting" || !showBanner) {
    return null;
  }

  return (
    <div
      className="bg-amber-500/10 text-amber-950 dark:text-amber-100 flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/20 px-3 py-1.5 text-xs"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>Reconnecting… Messages may update slowly until live sync returns.</span>
    </div>
  );
}
