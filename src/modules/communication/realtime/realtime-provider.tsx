"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { applyRealtimeEvent } from "@/modules/communication/realtime/cache-bridge";
import {
  CALL_EVENT_TYPES,
  type RealtimeEvent,
} from "@/modules/communication/realtime/event-schemas";
import {
  connectRtm,
  nudgeRtmReconnect,
  resubscribePendingChannels,
  scheduleRtmReconnect,
  type RealtimeSyncMode,
} from "@/modules/communication/realtime/transport";
import { useMe } from "@/modules/users-management/auth/queries";
import { can } from "@/shared/auth/permissions";
import { getActiveConversationId } from "@/modules/communication/realtime/active-conversation";
import { refreshCommunicationLiveState } from "@/modules/communication/shared/tenant-query";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

type RealtimeContextValue = {
  lastEvent: RealtimeEvent | null;
  connected: boolean;
  syncMode: RealtimeSyncMode;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  lastEvent: null,
  connected: false,
  syncMode: "connecting",
});

export function useRealtimeContext(): RealtimeContextValue {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { data: me } = useMe();
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncMode, setSyncMode] = useState<RealtimeSyncMode>("connecting");
  const teardownRef = useRef<(() => void | Promise<void>) | null>(null);
  const callHandlersRef = useRef<Set<(event: RealtimeEvent) => void>>(new Set());

  const canUseCommunication = Boolean(
    me && can(conversationPermissions.read, me.permissions ?? []),
  );

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      setLastEvent(event);
      applyRealtimeEvent(queryClient, tenantId, event, { currentUserId: me?.id });
      if (CALL_EVENT_TYPES.has(event.type)) {
        for (const handler of callHandlersRef.current) {
          handler(event);
        }
      }
    },
    [me?.id, queryClient, tenantId],
  );

  const handleEventRef = useRef(handleEvent);
  useEffect(() => {
    handleEventRef.current = handleEvent;
  }, [handleEvent]);

  const refreshLiveState = useCallback(() => {
    refreshCommunicationLiveState(queryClient, tenantId, getActiveConversationId());
    void resubscribePendingChannels();
  }, [queryClient, tenantId]);

  useEffect(() => {
    if (!canUseCommunication) {
      return;
    }

    let cancelled = false;
    const effectSessionId = crypto.randomUUID();

    const onEvent = (event: RealtimeEvent) => {
      handleEventRef.current(event);
    };

    const start = async (): Promise<() => void | Promise<void>> => {
      const sessionId = effectSessionId;
      try {
        const teardown = await connectRtm(onEvent, {
          onConnectionStateChange: setConnected,
          onSyncModeChange: setSyncMode,
          onReconnected: refreshLiveState,
        });
        if (cancelled) {
          await teardown();
          return () => undefined;
        }
        if (sessionId === effectSessionId) {
          teardownRef.current = teardown;
          refreshLiveState();
        }
        return teardown;
      } catch {
        if (sessionId === effectSessionId) {
          setConnected(false);
          setSyncMode("connecting");
        }
        scheduleRtmReconnect(onEvent, start);
        return () => undefined;
      }
    };

    const stop = async () => {
      await teardownRef.current?.();
      teardownRef.current = null;
      setConnected(false);
      setSyncMode("connecting");
    };

    void start();

    const onFocus = () => {
      refreshLiveState();
      nudgeRtmReconnect();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshLiveState();
        nudgeRtmReconnect();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void stop();
    };
  }, [canUseCommunication, refreshLiveState, tenantId]);

  const value = useMemo(() => ({ lastEvent, connected, syncMode }), [connected, lastEvent, syncMode]);

  const subscribeCallEvents = useCallback(
    (handler: (event: RealtimeEvent) => void) => {
      callHandlersRef.current.add(handler);
      return () => callHandlersRef.current.delete(handler);
    },
    [],
  );
  const callBridgeValue = useMemo(() => ({ subscribe: subscribeCallEvents }), [subscribeCallEvents]);

  return (
    <RealtimeContext.Provider value={value}>
      <CallEventBridgeContext.Provider value={callBridgeValue}>
        {children}
      </CallEventBridgeContext.Provider>
    </RealtimeContext.Provider>
  );
}

const CallEventBridgeContext = createContext<{
  subscribe: (handler: (event: RealtimeEvent) => void) => () => void;
} | null>(null);

export function useCallEventSubscription(handler: (event: RealtimeEvent) => void) {
  const ctx = useContext(CallEventBridgeContext);
  useEffect(() => {
    if (!ctx) {
      return;
    }
    return ctx.subscribe(handler);
  }, [ctx, handler]);
}
