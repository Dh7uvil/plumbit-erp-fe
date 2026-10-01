"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { agoraApi } from "@/modules/communication/calls/agora-api";
import type { Call, CallKind } from "@/modules/communication/calls/schemas";

type LocalTrack = {
  setEnabled: (enabled: boolean) => Promise<void> | void;
  setMuted?: (muted: boolean) => Promise<void> | void;
  setDevice?: (deviceId: string) => Promise<void>;
  getTrackLabel?: () => string;
  play: (element: HTMLElement) => void;
  close: () => void;
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
};

export type RemoteUser = {
  uid: number;
  hasAudio: boolean;
  hasVideo: boolean;
  audioTrack?: {
    play: () => void | Promise<void>;
    stop: () => void;
    setPlaybackDevice?: (deviceId: string) => Promise<void> | void;
  };
  videoTrack?: { play: (element: HTMLElement) => void; stop: () => void };
};

type RtcClient = {
  join: (appId: string, channel: string, token: string, uid: number) => Promise<number | string>;
  leave: () => Promise<void>;
  publish: (tracks: LocalTrack[]) => Promise<void>;
  unpublish: (tracks: LocalTrack[]) => Promise<void>;
  subscribe: (user: RemoteUser, mediaType: "audio" | "video") => Promise<void>;
  renewToken: (token: string) => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners: () => void;
  remoteUsers?: RemoteUser[];
};

type AgoraRtcModule = {
  createClient: (config: { mode: string; codec: string }) => RtcClient;
  createMicrophoneAndCameraTracks: () => Promise<[LocalTrack, LocalTrack]>;
  createMicrophoneAudioTrack: () => Promise<LocalTrack>;
  createScreenVideoTrack: (
    config?: { encoderConfig?: string },
    withAudio?: string,
  ) => Promise<LocalTrack | [LocalTrack, LocalTrack]>;
  getCameras: () => Promise<Array<{ deviceId: string; label: string }>>;
  getPlaybackDevices: () => Promise<Array<{ deviceId: string; label: string }>>;
};

export type AgoraRemoteParticipant = {
  uid: number;
  hasAudio: boolean;
  hasVideo: boolean;
  isSpeaking: boolean;
};

export type CallMediaState = {
  is_audio_muted: boolean;
  is_video_enabled: boolean;
  is_screen_sharing: boolean;
};

export type UseAgoraCallOptions = {
  call: Call;
  appId: string;
  enabled?: boolean;
  onMediaChange?: (state: CallMediaState) => void;
};

async function closeLocalTracks(tracks: LocalTrack[]) {
  for (const track of tracks) {
    track.close();
  }
}

async function destroyRtcClient(client: RtcClient | null) {
  if (!client) {
    return;
  }
  client.removeAllListeners();
  try {
    await client.leave();
  } catch {
    // Ignore teardown errors when the session is already gone.
  }
}

async function playRemoteAudioTrack(
  audioTrack: NonNullable<RemoteUser["audioTrack"]>,
  deviceId: string | null,
) {
  if (deviceId && audioTrack.setPlaybackDevice) {
    try {
      await audioTrack.setPlaybackDevice(deviceId);
    } catch {
      // Fall back to default playback device.
    }
  }
  await Promise.resolve(audioTrack.play()).catch((playError: unknown) => {
    console.warn("[RTC] remote audio play failed:", playError);
  });
}

async function subscribeRemoteMedia(
  client: RtcClient,
  user: RemoteUser,
  mediaType: "audio" | "video",
  deviceId: string | null,
): Promise<RemoteUser> {
  await client.subscribe(user, mediaType);
  if (mediaType === "audio" && user.audioTrack) {
    await playRemoteAudioTrack(user.audioTrack, deviceId);
  }
  return user;
}

async function applyPlaybackDeviceToRemoteTracks(
  deviceId: string,
  users: Map<number, RemoteUser>,
) {
  for (const user of users.values()) {
    if (user.audioTrack?.setPlaybackDevice) {
      try {
        await user.audioTrack.setPlaybackDevice(deviceId);
      } catch {
        // Continue applying to remaining tracks.
      }
    }
  }
}

export function useAgoraCall({ call, appId, enabled = true, onMediaChange }: UseAgoraCallOptions) {
  const clientRef = useRef<RtcClient | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const screenTrackRef = useRef<LocalTrack | null>(null);
  const cameraTrackRef = useRef<LocalTrack | null>(null);
  const remoteTrackUsersRef = useRef<Map<number, RemoteUser>>(new Map());
  const teardownRef = useRef<Promise<void>>(Promise.resolve());
  const refreshTokenRef = useRef<(() => Promise<string>) | null>(null);
  const mutedRef = useRef(false);
  const videoEnabledRef = useRef(call.kind === "VIDEO");
  const screenSharingRef = useRef(false);
  const mediaBusyRef = useRef(false);
  const selectedPlaybackDeviceIdRef = useRef<string | null>(null);
  const onMediaChangeRef = useRef(onMediaChange);
  const screenTrackEndedHandlerRef = useRef<(() => void) | null>(null);

  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(call.kind === "VIDEO");
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | null>(null);
  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<number | null>(null);
  const [activeSpeakerUid, setActiveSpeakerUid] = useState<number | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<AgoraRemoteParticipant[]>([]);
  const [remoteTrackUsers, setRemoteTrackUsers] = useState<RemoteUser[]>([]);
  const [playbackDevices, setPlaybackDevices] = useState<Array<{ deviceId: string; label: string }>>(
    [],
  );
  const [selectedPlaybackDeviceId, setSelectedPlaybackDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onMediaChangeRef.current = onMediaChange;
  }, [onMediaChange]);

  const notifyMediaChange = useCallback(
    (overrides?: Partial<CallMediaState>) => {
      onMediaChangeRef.current?.({
        is_audio_muted: overrides?.is_audio_muted ?? mutedRef.current,
        is_video_enabled: overrides?.is_video_enabled ?? videoEnabledRef.current,
        is_screen_sharing: overrides?.is_screen_sharing ?? screenSharingRef.current,
      });
    },
    [],
  );

  const refreshToken = useCallback(async (): Promise<string> => {
    const response = await agoraApi.mintRtcToken({
      channel_name: call.channel_name,
      call_id: call.id,
    });
    return response.token;
  }, [call.channel_name, call.id]);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !screenSharingRef.current) {
      return;
    }

    const screenTrack = screenTrackRef.current;
    if (screenTrack) {
      if (screenTrackEndedHandlerRef.current && screenTrack.off) {
        screenTrack.off("track-ended", screenTrackEndedHandlerRef.current);
        screenTrackEndedHandlerRef.current = null;
      }
      await client.unpublish([screenTrack]);
      screenTrack.close();
      screenTrackRef.current = null;
    }

    const cameraTrack = cameraTrackRef.current;
    if (cameraTrack && videoEnabledRef.current) {
      await client.publish([cameraTrack]);
      await cameraTrack.setEnabled(true);
    }

    screenSharingRef.current = false;
    setScreenSharing(false);
    notifyMediaChange({ is_screen_sharing: false });
  }, [notifyMediaChange]);

  const stopScreenShareRef = useRef(stopScreenShare);

  useEffect(() => {
    stopScreenShareRef.current = stopScreenShare;
  }, [stopScreenShare]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      await teardownRef.current;
      if (cancelled) {
        return;
      }

      if (!call.rtc_token || call.rtc_uid == null) {
        setConnecting(false);
        setError("Missing RTC token for this call");
        toast.error("Missing RTC token for this call");
        return;
      }

      setConnecting(true);
      setConnected(false);
      setReconnecting(false);
      setError(null);

      const upsertRemoteUser = (user: RemoteUser) => {
        remoteTrackUsersRef.current.set(user.uid, user);
        setRemoteTrackUsers(Array.from(remoteTrackUsersRef.current.values()));
        setRemoteUsers((current) => {
          const next = current.filter((item) => item.uid !== user.uid);
          next.push({
            uid: user.uid,
            hasAudio: user.hasAudio,
            hasVideo: user.hasVideo,
            isSpeaking: false,
          });
          return next;
        });
      };

      const removeRemoteUser = (uid: number) => {
        remoteTrackUsersRef.current.delete(uid);
        setRemoteTrackUsers(Array.from(remoteTrackUsersRef.current.values()));
        setRemoteUsers((current) => current.filter((item) => item.uid !== uid));
      };

      let client: RtcClient | null = null;
      let tracks: LocalTrack[] = [];

      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default as unknown as AgoraRtcModule;
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        try {
          (client as RtcClient & { startProxyServer?: () => Promise<void> }).startProxyServer?.();
        } catch {
          // Cloud proxy is optional; direct join may still succeed.
        }
        clientRef.current = client;

        try {
          const devices = await AgoraRTC.getPlaybackDevices();
          if (!cancelled) {
            setPlaybackDevices(devices);
          }
        } catch {
          // Playback device enumeration is optional.
        }

        const mergeRemoteUser = (user: RemoteUser, mediaType: "audio" | "video"): RemoteUser => {
          const existing = remoteTrackUsersRef.current.get(user.uid);
          return {
            uid: user.uid,
            hasAudio: mediaType === "audio" ? true : (existing?.hasAudio ?? user.hasAudio),
            hasVideo: mediaType === "video" ? true : (existing?.hasVideo ?? user.hasVideo),
            audioTrack: mediaType === "audio" ? user.audioTrack : existing?.audioTrack,
            videoTrack: mediaType === "video" ? user.videoTrack : existing?.videoTrack,
          };
        };

        client.on("user-published", (userArg, mediaTypeArg) => {
          void (async () => {
            if (!clientRef.current) {
              return;
            }
            const user = userArg as RemoteUser;
            const mediaType = mediaTypeArg as "audio" | "video";
            await subscribeRemoteMedia(
              clientRef.current,
              user,
              mediaType,
              selectedPlaybackDeviceIdRef.current,
            );
            upsertRemoteUser(mergeRemoteUser(user, mediaType));
          })();
        });

        client.on("user-unpublished", (userArg, mediaTypeArg) => {
          const user = userArg as RemoteUser;
          const mediaType = mediaTypeArg as "audio" | "video";
          const existing = remoteTrackUsersRef.current.get(user.uid);
          if (existing) {
            if (mediaType === "audio" && existing.audioTrack) {
              existing.audioTrack.stop();
            }
            if (mediaType === "video" && existing.videoTrack) {
              existing.videoTrack.stop();
            }
            const merged: RemoteUser = {
              ...existing,
              hasAudio: mediaType === "audio" ? false : existing.hasAudio,
              hasVideo: mediaType === "video" ? false : existing.hasVideo,
              audioTrack: mediaType === "audio" ? undefined : existing.audioTrack,
              videoTrack: mediaType === "video" ? undefined : existing.videoTrack,
            };
            remoteTrackUsersRef.current.set(user.uid, merged);
            setRemoteTrackUsers(Array.from(remoteTrackUsersRef.current.values()));
          }
          setRemoteUsers((current) =>
            current.map((item) =>
              item.uid === user.uid
                ? {
                    ...item,
                    hasAudio: mediaType === "audio" ? false : item.hasAudio,
                    hasVideo: mediaType === "video" ? false : item.hasVideo,
                  }
                : item,
            ),
          );
        });

        client.on("user-left", (userArg) => {
          const user = userArg as RemoteUser;
          removeRemoteUser(user.uid);
        });

        client.on("network-quality", (statsArg) => {
          const stats = statsArg as { uplinkNetworkQuality?: number; downlinkNetworkQuality?: number };
          const uplink = stats.uplinkNetworkQuality ?? 0;
          const downlink = stats.downlinkNetworkQuality ?? 0;
          setNetworkQuality(Math.max(uplink, downlink));
        });

        client.on("volume-indicator", (volumesArg) => {
          const volumes = volumesArg as Array<{ uid: number; level: number }>;
          const loudest = volumes.reduce<{ uid: number; level: number } | null>((best, entry) => {
            if (entry.level <= 5) {
              return best;
            }
            if (!best || entry.level > best.level) {
              return entry;
            }
            return best;
          }, null);
          const speakerUid = loudest?.uid ?? null;
          setActiveSpeakerUid(speakerUid);
          setRemoteUsers((current) =>
            current.map((item) => ({
              ...item,
              isSpeaking: speakerUid != null && item.uid === speakerUid,
            })),
          );
        });

        client.on("connection-state-change", (curStateArg) => {
          const curState = String(curStateArg);
          if (curState === "CONNECTED") {
            setConnected(true);
            setReconnecting(false);
            return;
          }
          if (curState === "RECONNECTING") {
            setReconnecting(true);
            return;
          }
          if (curState === "DISCONNECTED") {
            setConnected(false);
            setReconnecting(false);
          }
        });

        client.on("token-privilege-will-expire", () => {
          void (async () => {
            try {
              const token = await refreshTokenRef.current?.();
              if (!token || !clientRef.current) {
                return;
              }
              await clientRef.current.renewToken(token);
            } catch {
              toast.error("Could not refresh call token");
            }
          })();
        });

        client.on("token-privilege-did-expire", () => {
          void (async () => {
            try {
              const token = await refreshTokenRef.current?.();
              if (!token || !clientRef.current) {
                setError("Call token expired");
                toast.error("Call ended because the token expired");
                return;
              }
              await clientRef.current.renewToken(token);
            } catch {
              setError("Call token expired");
              toast.error("Call ended because the token expired");
            }
          })();
        });

        (
          client as RtcClient & { enableAudioVolumeIndicator?: () => void }
        ).enableAudioVolumeIndicator?.();

        if (cancelled) {
          await destroyRtcClient(client);
          return;
        }

        await client.join(appId, call.channel_name, call.rtc_token, call.rtc_uid);

        if (!cancelled && client.remoteUsers?.length) {
          for (const remoteUser of client.remoteUsers) {
            if (!remoteUser.hasAudio && !remoteUser.hasVideo) {
              continue;
            }
            let merged = remoteTrackUsersRef.current.get(remoteUser.uid) ?? {
              uid: remoteUser.uid,
              hasAudio: false,
              hasVideo: false,
            };
            if (remoteUser.hasAudio) {
              await subscribeRemoteMedia(
                client,
                remoteUser,
                "audio",
                selectedPlaybackDeviceIdRef.current,
              );
              merged = mergeRemoteUser(remoteUser, "audio");
              remoteTrackUsersRef.current.set(remoteUser.uid, merged);
            }
            if (remoteUser.hasVideo) {
              await subscribeRemoteMedia(client, remoteUser, "video", null);
              merged = mergeRemoteUser(
                { ...remoteUser, ...merged },
                "video",
              );
              remoteTrackUsersRef.current.set(remoteUser.uid, merged);
            }
            upsertRemoteUser(merged);
          }
        }

        if (call.kind === "VIDEO") {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          tracks = [audioTrack, videoTrack];
          cameraTrackRef.current = videoTrack;
          if (!cancelled) {
            setLocalVideoTrack(videoTrack);
          }
        } else {
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          tracks = [audioTrack];
        }

        if (cancelled) {
          await closeLocalTracks(tracks);
          await destroyRtcClient(client);
          return;
        }

        localTracksRef.current = tracks;

        const audioTrack = tracks[0];
        if (audioTrack) {
          if (mutedRef.current) {
            if (audioTrack.setMuted) {
              await audioTrack.setMuted(true);
            } else {
              await audioTrack.setEnabled(false);
            }
          }
        }

        const videoTrack = cameraTrackRef.current;
        if (videoTrack && !videoEnabledRef.current) {
          await videoTrack.setEnabled(false);
        }

        await client.publish(tracks);
        setConnecting(false);
        setConnected(true);
      } catch (joinError) {
        await closeLocalTracks(tracks);
        await destroyRtcClient(client);
        if (clientRef.current === client) {
          clientRef.current = null;
        }
        if (cancelled) {
          return;
        }
        setConnecting(false);
        setConnected(false);
        setLocalVideoTrack(null);
        const message = joinError instanceof Error ? joinError.message : "Could not join the call";
        setError(message);
        toast.error(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      const client = clientRef.current;
      const tracks = localTracksRef.current;
      const screenTrack = screenTrackRef.current;

      clientRef.current = null;
      localTracksRef.current = [];
      cameraTrackRef.current = null;
      screenTrackRef.current = null;
      remoteTrackUsersRef.current.clear();
      setRemoteTrackUsers([]);
      setRemoteUsers([]);
      setLocalVideoTrack(null);
      setConnected(false);
      setConnecting(false);
      setReconnecting(false);
      setScreenSharing(false);
      screenSharingRef.current = false;

      teardownRef.current = (async () => {
        if (screenTrack && screenTrackEndedHandlerRef.current && screenTrack.off) {
          screenTrack.off("track-ended", screenTrackEndedHandlerRef.current);
          screenTrackEndedHandlerRef.current = null;
        }
        screenTrack?.close();
        await closeLocalTracks(tracks);
        await destroyRtcClient(client);
      })();
    };
  }, [appId, call.channel_name, call.id, call.kind, call.rtc_token, call.rtc_uid, enabled]);

  const toggleMute = useCallback(async () => {
    if (mediaBusyRef.current) {
      return;
    }
    const audioTrack = localTracksRef.current[0];
    if (!audioTrack) {
      return;
    }

    const nextMuted = !mutedRef.current;
    mediaBusyRef.current = true;
    setMediaBusy(true);
    try {
      if (audioTrack.setMuted) {
        await audioTrack.setMuted(nextMuted);
      } else {
        await audioTrack.setEnabled(!nextMuted);
      }
      mutedRef.current = nextMuted;
      setMuted(nextMuted);
      notifyMediaChange({ is_audio_muted: nextMuted });
    } catch {
      toast.error(nextMuted ? "Could not mute microphone" : "Could not unmute microphone");
    } finally {
      mediaBusyRef.current = false;
      setMediaBusy(false);
    }
  }, [notifyMediaChange]);

  const toggleVideo = useCallback(async () => {
    if (mediaBusyRef.current || screenSharingRef.current) {
      return;
    }
    const videoTrack = cameraTrackRef.current;
    if (!videoTrack) {
      return;
    }

    const nextEnabled = !videoEnabledRef.current;
    mediaBusyRef.current = true;
    setMediaBusy(true);
    try {
      await videoTrack.setEnabled(nextEnabled);
      videoEnabledRef.current = nextEnabled;
      setVideoEnabled(nextEnabled);
      notifyMediaChange({ is_video_enabled: nextEnabled });
    } catch {
      toast.error(nextEnabled ? "Could not turn camera on" : "Could not turn camera off");
    } finally {
      mediaBusyRef.current = false;
      setMediaBusy(false);
    }
  }, [notifyMediaChange]);

  const switchCamera = useCallback(async () => {
    const videoTrack = cameraTrackRef.current;
    if (!videoTrack?.setDevice) {
      return;
    }
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default as unknown as AgoraRtcModule;
      const cameras = await AgoraRTC.getCameras();
      if (cameras.length < 2) {
        toast.message("No alternate camera found");
        return;
      }
      const currentLabel = videoTrack.getTrackLabel?.() ?? "";
      const next =
        cameras.find((camera) => camera.label !== currentLabel) ?? cameras[1] ?? cameras[0];
      await videoTrack.setDevice(next.deviceId);
    } catch {
      toast.error("Could not switch camera");
    }
  }, []);

  const setSpeakerDevice = useCallback(async (deviceId: string) => {
    try {
      await applyPlaybackDeviceToRemoteTracks(deviceId, remoteTrackUsersRef.current);
      selectedPlaybackDeviceIdRef.current = deviceId;
      setSelectedPlaybackDeviceId(deviceId);
    } catch {
      toast.error("Could not switch speaker");
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || mediaBusyRef.current) {
      return;
    }

    if (screenSharingRef.current) {
      mediaBusyRef.current = true;
      setMediaBusy(true);
      try {
        await stopScreenShareRef.current();
      } catch {
        toast.error("Could not stop screen sharing");
      } finally {
        mediaBusyRef.current = false;
        setMediaBusy(false);
      }
      return;
    }

    mediaBusyRef.current = true;
    setMediaBusy(true);
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default as unknown as AgoraRtcModule;
      const created = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" }, "disable");
      const screenTrack = Array.isArray(created) ? created[0] : created;
      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack && videoEnabledRef.current) {
        await client.unpublish([cameraTrack]);
      }

      const onTrackEnded = () => {
        void stopScreenShareRef.current();
      };
      screenTrackEndedHandlerRef.current = onTrackEnded;
      screenTrack.on?.("track-ended", onTrackEnded);

      screenTrackRef.current = screenTrack;
      await client.publish([screenTrack]);
      screenSharingRef.current = true;
      setScreenSharing(true);
      notifyMediaChange({ is_screen_sharing: true });
    } catch {
      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      screenSharingRef.current = false;
      setScreenSharing(false);
      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack && videoEnabledRef.current && clientRef.current) {
        try {
          await clientRef.current.publish([cameraTrack]);
          await cameraTrack.setEnabled(true);
        } catch {
          // Camera restore is best-effort after a failed screen share.
        }
      }
      toast.error("Screen sharing was cancelled or failed");
    } finally {
      mediaBusyRef.current = false;
      setMediaBusy(false);
    }
  }, [notifyMediaChange]);

  const isRinging = call.status === "RINGING" && remoteUsers.length === 0;

  return {
    connecting,
    connected,
    reconnecting,
    muted,
    videoEnabled,
    screenSharing,
    mediaBusy,
    localVideoTrack,
    duration,
    networkQuality,
    activeSpeakerUid,
    remoteUsers,
    remoteTrackUsers,
    playbackDevices,
    selectedPlaybackDeviceId,
    error,
    isRinging,
    kind: call.kind as CallKind,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleScreenShare,
    setSpeakerDevice,
    cameraTrackRef,
    screenTrackRef,
  };
}
