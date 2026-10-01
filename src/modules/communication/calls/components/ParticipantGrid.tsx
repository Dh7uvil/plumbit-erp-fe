"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";

import type { AgoraRemoteParticipant } from "@/modules/communication/calls/hooks/useAgoraCall";
import type { CallParticipant } from "@/modules/communication/calls/schemas";
import { Badge } from "@/shared/components/ui/badge";

function resolveAudioMuted(
  participant: CallParticipant,
  remote: AgoraRemoteParticipant | undefined,
  isCurrentUser: boolean,
  localMuted: boolean,
): boolean {
  if (isCurrentUser) {
    return localMuted;
  }
  // setMuted keeps the track published, so combine synced backend flags with Agora state.
  if (participant.is_audio_muted) {
    return true;
  }
  if (remote) {
    return !remote.hasAudio;
  }
  return false;
}

function resolveVideoEnabled(
  participant: CallParticipant,
  remote: AgoraRemoteParticipant | undefined,
  isCurrentUser: boolean,
  localVideoEnabled: boolean,
): boolean {
  if (isCurrentUser) {
    return localVideoEnabled;
  }
  if (!participant.is_video_enabled) {
    return false;
  }
  if (remote) {
    return remote.hasVideo;
  }
  return participant.is_video_enabled;
}

export function ParticipantGrid({
  participants,
  remoteUsers,
  userNames,
  activeSpeakerUid,
  currentUserId,
  localMuted = false,
  localVideoEnabled = true,
}: {
  participants: CallParticipant[];
  remoteUsers: AgoraRemoteParticipant[];
  userNames: Map<string, string>;
  activeSpeakerUid: number | null;
  currentUserId?: string;
  localMuted?: boolean;
  localVideoEnabled?: boolean;
}) {
  if (participants.length === 0 && remoteUsers.length === 0) {
    return <p className="text-muted-foreground text-sm">No participants yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {participants.map((participant) => {
        const remote = remoteUsers.find((user) => user.uid === participant.rtc_uid);
        const isSpeaking = activeSpeakerUid != null && participant.rtc_uid === activeSpeakerUid;
        const name = userNames.get(participant.user_id) ?? `User ${participant.user_id.slice(0, 8)}`;
        const isCurrentUser = currentUserId != null && participant.user_id === currentUserId;
        const isAudioMuted = resolveAudioMuted(participant, remote, isCurrentUser, localMuted);
        const isVideoOn = resolveVideoEnabled(
          participant,
          remote,
          isCurrentUser,
          localVideoEnabled,
        );

        return (
          <div
            key={participant.user_id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              isSpeaking || remote?.isSpeaking ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{name}</p>
              <Badge variant="secondary">{participant.status}</Badge>
            </div>
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
              {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {isVideoOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
              <span>UID {participant.rtc_uid}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
