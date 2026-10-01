"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { presenceApi } from "@/modules/communication/presence/api";
import { presenceKeys } from "@/modules/communication/presence/queries";
import type { PresenceStatus } from "@/modules/communication/presence/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

const HEARTBEAT_INTERVAL_MS = 30_000;

function resolveHeartbeatStatus(): PresenceStatus {
  if (typeof document === "undefined") {
    return "ONLINE";
  }
  if (document.visibilityState === "hidden") {
    return "AWAY";
  }
  return "ONLINE";
}

export function usePresenceHeartbeat(enabled = true): void {
  const queryClient = useQueryClient();
  const presenceUsersKey = useTenantQueryKey(presenceKeys.all);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sendHeartbeat = async () => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      try {
        await presenceApi.heartbeat({ status: resolveHeartbeatStatus() });
        await queryClient.invalidateQueries({ queryKey: presenceUsersKey });
      } catch {
        // Presence heartbeat failures should not break the UI.
      } finally {
        inFlightRef.current = false;
      }
    };

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      void sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, presenceUsersKey, queryClient]);
}
