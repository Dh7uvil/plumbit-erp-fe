"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

import type { RemoteUser, useAgoraCall } from "@/modules/communication/calls/hooks/useAgoraCall";
import type { CallKind } from "@/modules/communication/calls/schemas";
import { Badge } from "@/shared/components/ui/badge";

function networkQualityLabel(quality: number | null): string {
  if (quality == null) {
    return "Checking…";
  }
  if (quality <= 2) {
    return "Excellent";
  }
  if (quality <= 4) {
    return "Fair";
  }
  return "Poor";
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function playRemoteTracks(users: RemoteUser[], refs: Map<number, HTMLDivElement>) {
  for (const user of users) {
    if (user.audioTrack) {
      void Promise.resolve(user.audioTrack.play()).catch(() => undefined);
    }
    const container = refs.get(user.uid);
    if (container && user.videoTrack) {
      try {
        user.videoTrack.play(container);
      } catch {
        // Retry on the next layout pass when the container is ready.
      }
    }
  }
}

export function VideoCall({
  kind,
  agora,
  remoteUsers,
  remoteTrackUsers,
  activeSpeakerUid,
}: {
  kind: CallKind;
  agora: ReturnType<typeof useAgoraCall>;
  remoteUsers: ReturnType<typeof useAgoraCall>["remoteUsers"];
  remoteTrackUsers: RemoteUser[];
  activeSpeakerUid: number | null;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const mountRemotePlayer = useCallback(
    (uid: number, node: HTMLDivElement | null) => {
      if (!node) {
        remoteRefs.current.delete(uid);
        return;
      }
      remoteRefs.current.set(uid, node);
      const user = remoteTrackUsers.find((entry) => entry.uid === uid);
      if (user?.videoTrack) {
        try {
          user.videoTrack.play(node);
        } catch {
          // Handled by the layout effect below.
        }
      }
      if (user?.audioTrack) {
        void Promise.resolve(user.audioTrack.play()).catch(() => undefined);
      }
    },
    [remoteTrackUsers],
  );

  useLayoutEffect(() => {
    const videoTrack = agora.localVideoTrack;
    if (kind !== "VIDEO" || !localRef.current || !videoTrack || agora.screenSharing || !agora.videoEnabled) {
      return;
    }
    videoTrack.play(localRef.current);
  }, [agora.localVideoTrack, agora.screenSharing, agora.videoEnabled, kind]);

  useLayoutEffect(() => {
    const screenTrack = agora.screenTrackRef.current;
    if (!localRef.current || !screenTrack) {
      return;
    }
    screenTrack.play(localRef.current);
  }, [agora.screenTrackRef, agora.screenSharing]);

  useLayoutEffect(() => {
    playRemoteTracks(remoteTrackUsers, remoteRefs.current);
  }, [remoteTrackUsers, remoteUsers]);

  const primaryRemote = remoteUsers.find((user) => user.uid === activeSpeakerUid) ?? remoteUsers[0];

  if (kind === "AUDIO" && remoteUsers.length === 0) {
    return (
      <div className="bg-muted relative flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl md:min-h-[420px]">
        <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold">
          {primaryRemote ? String(primaryRemote.uid).slice(-2) : "…"}
        </div>
        <p className="text-muted-foreground text-sm">Waiting for others to join…</p>
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {agora.connecting ? "Connecting…" : agora.reconnecting ? "Reconnecting…" : "In call"}
          </Badge>
          <Badge variant="outline">{formatDuration(agora.duration)}</Badge>
        </div>
        {agora.error ? (
          <p className="text-destructive px-4 text-center text-sm">{agora.error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-black md:min-h-[420px]">
      {agora.error ? (
        <div className="absolute top-14 right-4 left-4 z-10 rounded-md bg-destructive/90 px-3 py-2 text-center text-xs text-white">
          {agora.error}
        </div>
      ) : null}
      {remoteUsers.length === 0 ? (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Waiting for others to join…
        </div>
      ) : remoteUsers.length === 1 ? (
        <div
          ref={(node) => {
            if (primaryRemote) {
              mountRemotePlayer(primaryRemote.uid, node);
            }
          }}
          className={`absolute inset-0 ${primaryRemote?.isSpeaking ? "ring-primary ring-2" : ""}`}
        />
      ) : (
        <div className="grid h-full grid-cols-2 gap-1 p-1">
          {remoteUsers.slice(0, 4).map((user) => (
            <div
              key={user.uid}
              ref={(node) => mountRemotePlayer(user.uid, node)}
              className={`relative min-h-[140px] rounded-lg bg-zinc-900 ${
                user.isSpeaking ? "ring-primary ring-2" : ""
              }`}
            >
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                UID {user.uid}
              </span>
            </div>
          ))}
        </div>
      )}

      {kind === "VIDEO" && !agora.screenSharing ? (
        <div
          ref={localRef}
          className="absolute right-4 bottom-4 h-28 w-40 overflow-hidden rounded-lg bg-zinc-900 shadow-lg"
        />
      ) : agora.screenSharing ? (
        <div
          ref={localRef}
          className="absolute right-4 bottom-4 rounded-lg bg-black/70 px-3 py-1 text-xs text-white"
        >
          Sharing screen
        </div>
      ) : null}

      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-black/60 text-white">
          {agora.connecting ? "Connecting…" : agora.reconnecting ? "Reconnecting…" : "In call"}
        </Badge>
        <Badge variant="outline" className="border-white/20 bg-black/60 text-white">
          {formatDuration(agora.duration)}
        </Badge>
        <Badge variant="outline" className="border-white/20 bg-black/60 text-white">
          {networkQualityLabel(agora.networkQuality)}
        </Badge>
      </div>
    </div>
  );
}
