"use client";

import { useCallback, useMemo } from "react";

import { CallControls } from "@/modules/communication/calls/components/CallControls";
import { OutgoingCall } from "@/modules/communication/calls/components/OutgoingCall";
import { ParticipantGrid } from "@/modules/communication/calls/components/ParticipantGrid";
import { VideoCall } from "@/modules/communication/calls/components/VideoCall";
import {
  useAgoraCall,
  type CallMediaState,
} from "@/modules/communication/calls/hooks/useAgoraCall";
import { useUpdateCallMedia } from "@/modules/communication/calls/mutations";
import type { Call } from "@/modules/communication/calls/schemas";
import { MessageThreadPanel } from "@/modules/communication/messages/components/message-thread-panel";
import {
  buildConversationUserNames,
  useUserDirectory,
} from "@/modules/communication/shared/use-user-directory";
import { useMe } from "@/modules/users-management/auth/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function CallStage({
  call,
  appId,
  calleeName,
  onLeave,
  onEnd,
  busy,
}: {
  call: Call;
  appId: string;
  calleeName?: string;
  onLeave: () => void;
  onEnd: () => void;
  busy?: boolean;
}) {
  const { data: me } = useMe();
  const { byId } = useUserDirectory();
  const updateCallMedia = useUpdateCallMedia();
  const handleMediaChange = useCallback(
    (state: CallMediaState) => {
      updateCallMedia.mutate(
        { id: call.id, values: state },
        {
          onError: () => {
            console.warn("[RTC] failed to sync media state");
          },
        },
      );
    },
    [call.id, updateCallMedia],
  );
  const agora = useAgoraCall({ call, appId, enabled: true, onMediaChange: handleMediaChange });

  const userNames = useMemo(() => buildConversationUserNames(byId, me), [byId, me]);
  const isGroup = call.scope === "GROUP";
  const canEndForAll = Boolean(me && call.initiated_by === me.id);

  const showOutgoing = call.status === "RINGING" && agora.remoteUsers.length === 0;

  if (showOutgoing) {
    return (
      <OutgoingCall
        call={call}
        calleeName={calleeName}
        onCancel={onEnd}
        error={agora.error}
      />
    );
  }

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
      {agora.error ? (
        <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-center gap-3 border-b px-4 py-2 text-center text-sm">
          <span>{agora.error}</span>
          <button type="button" className="font-medium underline" onClick={onEnd}>
            Close
          </button>
        </div>
      ) : null}
      <div className="grid flex-1 grid-cols-1 gap-4 px-6 pt-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <VideoCall
          kind={call.kind}
          agora={agora}
          remoteUsers={agora.remoteUsers}
          remoteTrackUsers={agora.remoteTrackUsers}
          activeSpeakerUid={agora.activeSpeakerUid}
        />

        <Tabs defaultValue="chat" className="min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>
          <TabsContent
            value="chat"
            className="mt-2 h-[calc(100%-3rem)] min-h-[280px] overflow-hidden rounded-lg border"
          >
            <MessageThreadPanel conversationId={call.conversation_id} />
          </TabsContent>
          <TabsContent value="participants" className="mt-2 max-h-[420px] overflow-y-auto">
            <ParticipantGrid
              participants={call.participants}
              remoteUsers={agora.remoteUsers}
              userNames={userNames}
              activeSpeakerUid={agora.activeSpeakerUid}
              currentUserId={me?.id}
              localMuted={agora.muted}
              localVideoEnabled={agora.videoEnabled}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CallControls
        kind={call.kind}
        muted={agora.muted}
        videoEnabled={agora.videoEnabled}
        screenSharing={agora.screenSharing}
        playbackDevices={agora.playbackDevices}
        selectedPlaybackDeviceId={agora.selectedPlaybackDeviceId}
        isGroup={isGroup}
        canEndForAll={canEndForAll || !isGroup}
        busy={busy}
        mediaBusy={agora.mediaBusy}
        onToggleMute={() => void agora.toggleMute()}
        onToggleVideo={() => void agora.toggleVideo()}
        onSwitchCamera={() => void agora.switchCamera()}
        onToggleScreenShare={() => void agora.toggleScreenShare()}
        onSelectSpeaker={(deviceId) => void agora.setSpeakerDevice(deviceId)}
        onLeave={onLeave}
        onEndForAll={onEnd}
      />
    </div>
  );
}
