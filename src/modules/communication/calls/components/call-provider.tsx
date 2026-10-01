"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { API_VERSION_PREFIX } from "@/config/constants";

import { callsApi } from "@/modules/communication/calls/api";
import { CallSessionContext } from "@/modules/communication/calls/call-session-context";
import { CallStage } from "@/modules/communication/calls/components/call-stage";
import { IncomingCallDialog } from "@/modules/communication/calls/components/incoming-call-dialog";
import {
  broadcastCallLockDismiss,
  useCallDialogLock,
} from "@/modules/communication/calls/hooks/use-call-dialog-lock";
import { useIncomingCallAlert } from "@/modules/communication/calls/hooks/use-incoming-call-alert";
import { useIncomingCallPolling } from "@/modules/communication/calls/hooks/use-incoming-call-polling";
import {
  useAcceptCall,
  useEndCall,
  useLeaveCall,
  useRejectCall,
} from "@/modules/communication/calls/mutations";
import { callKeys } from "@/modules/communication/calls/queries";
import type { Call } from "@/modules/communication/calls/schemas";
import { useConversation } from "@/modules/communication/conversations/queries";
import {
  useCallEventSubscription,
  useRealtimeContext,
} from "@/modules/communication/realtime/realtime-provider";
import {
  subscribeConversationChannel,
  unsubscribeConversationChannel,
} from "@/modules/communication/realtime/transport";
import { useUserDirectory } from "@/modules/communication/shared/use-user-directory";
import { publicEnv } from "@/config/env.public";
import { useMe } from "@/modules/users-management/auth/queries";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

const DEFAULT_RING_TIMEOUT_SECONDS = 45;

function resolveCallerName(
  initiatedBy: string | null | undefined,
  eventCallerName: unknown,
  byId: Map<string, { id: string; name: string; email: string }>,
): string | undefined {
  if (typeof eventCallerName === "string" && eventCallerName.trim()) {
    return eventCallerName;
  }
  if (initiatedBy) {
    return byId.get(initiatedBy)?.name;
  }
  return undefined;
}

function resolveCalleeName(
  call: Call | null,
  meId: string | undefined,
  byId: Map<string, { id: string; name: string; email: string }>,
  conversationParticipantIds: string[] | undefined,
): string | undefined {
  if (!call || !meId) {
    return undefined;
  }
  const otherParticipantId =
    call.participants.find((participant) => participant.user_id !== meId)?.user_id ??
    conversationParticipantIds?.find((participantId) => participantId !== meId);
  if (otherParticipantId) {
    return byId.get(otherParticipantId)?.name;
  }
  return call.scope === "GROUP" ? "Group" : undefined;
}

function mergeActiveCall(current: Call, detail: Call): Call {
  return {
    ...current,
    ...detail,
    rtc_token: current.rtc_token ?? detail.rtc_token ?? null,
    rtc_uid: current.rtc_uid ?? detail.rtc_uid ?? null,
    token_expires_at: current.token_expires_at ?? detail.token_expires_at ?? null,
  };
}

export function CallProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { data: me } = useMe();
  const { syncMode } = useRealtimeContext();
  const { byId } = useUserDirectory();
  const acceptCall = useAcceptCall();
  const rejectCall = useRejectCall();
  const endCall = useEndCall();
  const leaveCall = useLeaveCall();
  const [incoming, setIncoming] = useState<Call | null>(null);
  const [incomingCallerLabel, setIncomingCallerLabel] = useState<string | undefined>();
  const [active, setActive] = useState<Call | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const holdsCallDialogLock = useCallDialogLock();
  const appId = publicEnv.NEXT_PUBLIC_AGORA_APP_ID;
  const trackedConversationId = active?.conversation_id ?? incoming?.conversation_id ?? null;
  const { data: trackedConversation } = useConversation(trackedConversationId);

  const invalidateCallQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["tenant", tenantId, ...callKeys.all],
    });
  }, [queryClient, tenantId]);

  const callerName = useMemo(
    () =>
      incomingCallerLabel ??
      resolveCallerName(incoming?.initiated_by, undefined, byId),
    [byId, incoming?.initiated_by, incomingCallerLabel],
  );

  const calleeName = useMemo(
    () =>
      resolveCalleeName(
        active,
        me?.id,
        byId,
        trackedConversation?.participants.map((participant) => participant.user_id),
      ),
    [active, byId, me?.id, trackedConversation?.participants],
  );

  useIncomingCallAlert({ call: incoming, callerName });

  useEffect(() => {
    activeCallRef.current = active;
  }, [active]);

  useEffect(() => {
    if (typeof window === "undefined" || !me?.id) {
      return;
    }
    const onPageHide = () => {
      const call = activeCallRef.current;
      if (!call) {
        return;
      }
      const endpoint =
        call.status === "RINGING" && call.initiated_by === me.id ? "end" : "leave";
      void fetch(`${API_VERSION_PREFIX}/communication/calls/${call.id}/${endpoint}`, {
        method: "POST",
        keepalive: true,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [me?.id]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    const channel = new BroadcastChannel("plumbit-call-lock");
    const onMessage = (event: MessageEvent<{ type?: string; callId?: string }>) => {
      if (event.data?.type !== "dismiss" || !event.data.callId) {
        return;
      }
      setIncoming((current) => (current?.id === event.data.callId ? null : current));
      setIncomingCallerLabel(undefined);
    };
    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, []);

  useEffect(() => {
    const channelName = trackedConversation?.channel_name;
    if (!channelName) {
      return;
    }
    void subscribeConversationChannel(channelName);
    return () => {
      void unsubscribeConversationChannel(channelName);
    };
  }, [trackedConversation?.channel_name]);

  const handleActiveUpdated = useCallback((detail: Call) => {
    setActive((current) => (current?.id === detail.id ? mergeActiveCall(current, detail) : current));
  }, []);

  useIncomingCallPolling({
    enabled: Boolean(me),
    userId: me?.id,
    syncMode,
    incomingCallId: incoming?.id ?? null,
    activeCallId: active?.id ?? null,
    activeCallStatus: active?.status ?? null,
    onIncoming: (call) => {
      setIncomingCallerLabel(undefined);
      setIncoming(call);
    },
    onIncomingDismissed: (callId) => {
      setIncoming((current) => (current?.id === callId ? null : current));
      setIncomingCallerLabel(undefined);
    },
    onActiveUpdated: handleActiveUpdated,
    onActiveEnded: (callId) => {
      setActive((current) => (current?.id === callId ? null : current));
      toast.info("Call ended");
    },
  });

  useCallEventSubscription(
    useCallback(
      (event) => {
        if (!me) {
          return;
        }

        if (event.type.startsWith("call.")) {
          invalidateCallQueries();
        }

        if (event.type === "call.invited") {
          if (event.actor_id === me.id) {
            return;
          }
          const callId = typeof event.data.call_id === "string" ? event.data.call_id : null;
          if (!callId) {
            return;
          }
          setIncomingCallerLabel(
            typeof event.data.caller_name === "string" ? event.data.caller_name : undefined,
          );
          setIncoming({
            id: callId,
            conversation_id: event.conversation_id ?? "",
            channel_name: String(event.data.channel_name ?? ""),
            kind: (event.data.kind as Call["kind"]) ?? "VIDEO",
            scope: (event.data.scope as Call["scope"]) ?? "DIRECT",
            status: "RINGING",
            initiated_by: event.actor_id ?? null,
            started_at: event.at ?? new Date().toISOString(),
            answered_at: null,
            ended_at: null,
            end_reason: null,
            duration_seconds: null,
            participants: [],
          });
        }

        if (event.type === "call.accepted") {
          const acceptedCallId =
            typeof event.data.call_id === "string" ? event.data.call_id : null;
          if (acceptedCallId) {
            setActive((current) => {
              if (current?.id !== acceptedCallId) {
                return current;
              }
              return {
                ...current,
                status: "ACTIVE",
                answered_at:
                  typeof event.at === "string" ? event.at : (current.answered_at ?? new Date().toISOString()),
              };
            });
            void callsApi.get(acceptedCallId).then((detail) => {
              setActive((current) =>
                current?.id === acceptedCallId ? mergeActiveCall(current, detail) : current,
              );
            });
          }
        }

        if (event.type === "call.media_changed") {
          const changedCallId =
            typeof event.data.call_id === "string" ? event.data.call_id : null;
          const actorId = event.actor_id;
          if (!changedCallId || !actorId) {
            return;
          }
          setActive((current) => {
            if (current?.id !== changedCallId) {
              return current;
            }
            return {
              ...current,
              participants: current.participants.map((participant) => {
                if (participant.user_id !== actorId) {
                  return participant;
                }
                return {
                  ...participant,
                  is_audio_muted:
                    typeof event.data.is_audio_muted === "boolean"
                      ? event.data.is_audio_muted
                      : participant.is_audio_muted,
                  is_video_enabled:
                    typeof event.data.is_video_enabled === "boolean"
                      ? event.data.is_video_enabled
                      : participant.is_video_enabled,
                  is_screen_sharing:
                    typeof event.data.is_screen_sharing === "boolean"
                      ? event.data.is_screen_sharing
                      : participant.is_screen_sharing,
                };
              }),
            };
          });
        }

        if (event.type === "call.participant_left") {
          const leftCallId = typeof event.data.call_id === "string" ? event.data.call_id : null;
          if (leftCallId && event.actor_id !== me.id) {
            setActive((current) => {
              if (current?.id === leftCallId && current.scope === "DIRECT") {
                toast.info("Call ended");
                return null;
              }
              return current;
            });
          }
        }

        if (event.type === "call.missed") {
          const missedCallId = typeof event.data.call_id === "string" ? event.data.call_id : null;
          if (!missedCallId) {
            return;
          }
          const isCaller = active?.id === missedCallId && active.initiated_by === me.id;
          if (isCaller) {
            toast.info("No answer");
          } else if (incoming?.id !== missedCallId) {
            toast.info("Missed call");
          }
        }

        if (event.type === "call.rejected") {
          if (event.actor_id !== me.id) {
            toast.info("Call declined");
          }
        }

        if (
          event.type === "call.ended" ||
          event.type === "call.missed" ||
          event.type === "call.rejected"
        ) {
          const endedCallId =
            typeof event.data.call_id === "string" ? event.data.call_id : null;
          setIncoming((current) => (endedCallId && current?.id !== endedCallId ? current : null));
          setIncomingCallerLabel(undefined);
          setActive((current) => (endedCallId && current?.id !== endedCallId ? current : null));
        }
      },
      [incoming?.id, invalidateCallQueries, me],
    ),
  );

  const beginCall = useCallback(
    (call: Call) => {
      if (!appId) {
        toast.error("Set NEXT_PUBLIC_AGORA_APP_ID to start video calls");
        return;
      }
      if (!call.rtc_token) {
        toast.error("Video calls require Agora App ID and certificate on the backend");
        return;
      }
      if (active && active.id !== call.id) {
        toast.message("Leave your current call before joining another");
        return;
      }
      setIncoming(null);
      setActive(call);
    },
    [active, appId],
  );

  const closeActiveCall = useCallback(
    (callId: string) => {
      setActive(null);
      endCall.mutate(callId, {
        onError: () => {
          leaveCall.mutate(callId, {
            onError: () => toast.error("Could not end call on server"),
          });
        },
      });
    },
    [endCall, leaveCall],
  );

  useEffect(() => {
    if (!active || !me || active.status !== "RINGING" || active.initiated_by !== me.id) {
      return;
    }
    const timeoutMs = DEFAULT_RING_TIMEOUT_SECONDS * 1000;
    const timer = window.setTimeout(() => {
      const callId = active.id;
      setActive(null);
      toast.info("No answer");
      endCall.mutate(callId, {
        onError: () => {
          leaveCall.mutate(callId, {
            onError: () => toast.error("Could not end call on server"),
          });
        },
      });
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [active, endCall, leaveCall, me]);

  const busy =
    acceptCall.isPending || rejectCall.isPending || endCall.isPending || leaveCall.isPending;

  const dialog = useMemo(
    () => (
      <IncomingCallDialog
        call={incoming}
        open={Boolean(incoming) && holdsCallDialogLock}
        callerName={callerName}
        busy={busy}
        onAccept={() => {
          if (!incoming) {
            return;
          }
          broadcastCallLockDismiss(incoming.id);
          acceptCall.mutate(incoming.id, {
            onSuccess: (call) => {
              setIncoming(null);
              setActive(call);
            },
            onError: () => toast.error("Could not accept call"),
          });
        }}
        onReject={() => {
          if (!incoming) {
            return;
          }
          broadcastCallLockDismiss(incoming.id);
          rejectCall.mutate(incoming.id, {
            onSuccess: () => setIncoming(null),
            onError: () => toast.error("Could not reject call"),
          });
        }}
      />
    ),
    [acceptCall, busy, callerName, holdsCallDialogLock, incoming, rejectCall],
  );

  const sessionValue = useMemo(
    () => ({ beginCall, activeCall: active }),
    [active, beginCall],
  );

  return (
    <CallSessionContext.Provider value={sessionValue}>
      {children}
      {dialog}
      {active && appId ? (
        <CallStage
          call={active}
          appId={appId}
          calleeName={calleeName}
          busy={busy}
          onLeave={() => {
            const callId = active.id;
            setActive(null);
            leaveCall.mutate(callId, {
              onError: () => toast.error("Could not leave call"),
            });
          }}
          onEnd={() => closeActiveCall(active.id)}
        />
      ) : null}
    </CallSessionContext.Provider>
  );
}
