"use client";

import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  RefreshCcw,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";

import type { CallKind } from "@/modules/communication/calls/schemas";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export function CallControls({
  kind,
  muted,
  videoEnabled,
  screenSharing,
  playbackDevices,
  selectedPlaybackDeviceId,
  isGroup,
  canEndForAll,
  busy,
  mediaBusy,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onToggleScreenShare,
  onSelectSpeaker,
  onLeave,
  onEndForAll,
}: {
  kind: CallKind;
  muted: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  playbackDevices: Array<{ deviceId: string; label: string }>;
  selectedPlaybackDeviceId: string | null;
  isGroup: boolean;
  canEndForAll: boolean;
  busy?: boolean;
  mediaBusy?: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleScreenShare: () => void;
  onSelectSpeaker: (deviceId: string) => void;
  onLeave: () => void;
  onEndForAll: () => void;
}) {
  const controlsDisabled = Boolean(busy || mediaBusy);

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-5">
      {playbackDevices.length > 0 ? (
        <Select
          value={selectedPlaybackDeviceId ?? playbackDevices[0]?.deviceId}
          onValueChange={onSelectSpeaker}
        >
          <SelectTrigger className="w-full max-w-xs">
            <Volume2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Speaker" />
          </SelectTrigger>
          <SelectContent>
            {playbackDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || "Speaker"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant={muted ? "destructive" : "secondary"}
          size="icon"
          className="h-11 w-11 md:h-12 md:w-12"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          disabled={controlsDisabled}
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        {kind === "VIDEO" ? (
          <>
            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className="h-11 w-11 md:h-12 md:w-12"
              onClick={onToggleVideo}
              aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
              disabled={controlsDisabled || screenSharing}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-11 md:h-12 md:w-12"
              onClick={onSwitchCamera}
              aria-label="Switch camera"
              disabled={controlsDisabled || screenSharing}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </>
        ) : null}

        <Button
          variant={screenSharing ? "default" : "secondary"}
          size="icon"
          className="h-11 w-11 md:h-12 md:w-12"
          onClick={onToggleScreenShare}
          aria-label="Share screen"
          disabled={controlsDisabled}
        >
          <MonitorUp className="h-4 w-4" />
        </Button>

        {isGroup ? (
          <Button variant="outline" onClick={onLeave} disabled={busy}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave
          </Button>
        ) : null}

        {canEndForAll ? (
          <Button variant="destructive" onClick={onEndForAll} disabled={busy}>
            <PhoneOff className="mr-2 h-4 w-4" />
            {isGroup ? "End for all" : "End call"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
