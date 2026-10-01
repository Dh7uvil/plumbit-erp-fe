"use client";

import { useEffect } from "react";

import type { RealtimeEvent } from "@/modules/communication/realtime/event-schemas";
import { useRealtimeContext } from "@/modules/communication/realtime/realtime-provider";

export function useRealtimeEvent(
  types: readonly string[],
  handler: (event: RealtimeEvent) => void,
) {
  const { lastEvent } = useRealtimeContext();
  useEffect(() => {
    if (!lastEvent || !types.includes(lastEvent.type)) {
      return;
    }
    handler(lastEvent);
  }, [handler, lastEvent, types]);
}
