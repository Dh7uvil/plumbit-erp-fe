"use client";

import { useEffect } from "react";

import { callsApi } from "@/modules/communication/calls/api";
import type { Call } from "@/modules/communication/calls/schemas";
import type { RealtimeSyncMode } from "@/modules/communication/realtime/transport";

const POLL_INTERVAL_LIVE_MS = 10_000;
const POLL_INTERVAL_FALLBACK_MS = 3_000;
const DEFAULT_RING_TIMEOUT_SECONDS = 45;
const TERMINAL_STATUSES = new Set(["ENDED", "CANCELLED", "REJECTED", "MISSED"]);

function isStaleRingingCall(call: Call, ringTimeoutSeconds = DEFAULT_RING_TIMEOUT_SECONDS): boolean {
  if (call.status !== "RINGING") {
    return false;
  }
  const startedAt = Date.parse(call.started_at);
  if (Number.isNaN(startedAt)) {
    return false;
  }
  return Date.now() - startedAt > ringTimeoutSeconds * 1000;
}

function findIncomingRingingCall(calls: Call[], userId: string): Call | null {
  return (
    calls.find(
      (call) =>
        call.status === "RINGING" &&
        !isStaleRingingCall(call) &&
        call.initiated_by !== userId &&
        call.participants.some(
          (participant) => participant.user_id === userId && participant.status === "RINGING",
        ),
    ) ?? null
  );
}

type UseIncomingCallPollingOptions = {
  enabled: boolean;
  userId: string | undefined;
  syncMode: RealtimeSyncMode;
  incomingCallId: string | null;
  activeCallId: string | null;
  activeCallStatus: Call["status"] | null;
  onIncoming: (call: Call) => void;
  onIncomingDismissed: (callId: string) => void;
  onActiveUpdated: (call: Call) => void;
  onActiveEnded: (callId: string) => void;
};

export function useIncomingCallPolling({
  enabled,
  userId,
  syncMode,
  incomingCallId,
  activeCallId,
  activeCallStatus,
  onIncoming,
  onIncomingDismissed,
  onActiveUpdated,
  onActiveEnded,
}: UseIncomingCallPollingOptions) {
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let cancelled = false;
    const waitingForAnswer = activeCallId != null && activeCallStatus === "RINGING";
    const intervalMs = waitingForAnswer
      ? POLL_INTERVAL_FALLBACK_MS
      : syncMode === "live"
        ? POLL_INTERVAL_LIVE_MS
        : POLL_INTERVAL_FALLBACK_MS;

    const poll = async () => {
      try {
        const result = await callsApi.list({ status: "RINGING", page_size: 20, mine: true });
        if (cancelled) {
          return;
        }

        const incoming = findIncomingRingingCall(result.data, userId);
        if (
          incoming &&
          incoming.id !== incomingCallId &&
          incoming.id !== activeCallId
        ) {
          onIncoming(incoming);
        } else if (incomingCallId && !incoming) {
          const detail = await callsApi.get(incomingCallId);
          if (cancelled) {
            return;
          }
          if (detail.status !== "RINGING" || isStaleRingingCall(detail)) {
            onIncomingDismissed(incomingCallId);
          }
        }

        if (activeCallId) {
          const detail = await callsApi.get(activeCallId);
          if (cancelled) {
            return;
          }
          if (TERMINAL_STATUSES.has(detail.status)) {
            onActiveEnded(activeCallId);
          } else if (detail.status === "ACTIVE") {
            onActiveUpdated(detail);
          }
        }
      } catch {
        // Ignore transient poll errors; next interval retries.
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    activeCallId,
    activeCallStatus,
    enabled,
    incomingCallId,
    onActiveEnded,
    onActiveUpdated,
    onIncoming,
    onIncomingDismissed,
    syncMode,
    userId,
  ]);
}
