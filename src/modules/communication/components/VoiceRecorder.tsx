"use client";

import { Loader2, Mic, Pause, Play, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadChatAttachment } from "@/modules/communication/attachments/api";
import type { Message } from "@/modules/communication/messages/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { randomUuid } from "@/shared/lib/uuid";

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export type VoiceRecorderProps = {
  conversationId: string;
  disabled?: boolean;
  onSent?: (message: Message) => void;
  className?: string;
  /** Renders panel above composer + icon button in the bar. */
  compact?: boolean;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function useVoiceRecorder({
  conversationId,
  disabled = false,
  onSent,
}: Pick<VoiceRecorderProps, "conversationId" | "disabled" | "onSent">) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdActiveRef = useRef(false);

  const cleanupStream = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const resetPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewBlob(null);
    setWaveform([]);
    setElapsedMs(0);
    setIsPlaying(false);
    setPlaybackSpeed(1);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      audioRef.current?.pause();
    };
  }, [cleanupStream, previewUrl]);

  const sampleWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      return;
    }
    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (const value of buffer) {
      const normalized = (value - 128) / 128;
      sum += Math.abs(normalized);
    }
    const level = sum / buffer.length;
    setWaveform((current) => [...current.slice(-40), level]);
    rafRef.current = requestAnimationFrame(sampleWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || recording || uploading) {
      return;
    }
    try {
      resetPreview();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        cleanupStream();
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsedMs(0);
      sampleWaveform();
    } catch {
      toast.error("Microphone access is required to record voice messages");
      cleanupStream();
    }
  }, [cleanupStream, disabled, recording, resetPreview, sampleWaveform, uploading]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }
    recorder.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    setElapsedMs(Date.now() - startedAtRef.current);
  }, []);

  useEffect(() => {
    if (!recording) {
      return;
    }
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => window.clearInterval(timer);
  }, [recording]);

  const togglePlayback = async () => {
    if (!previewUrl) {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    audioRef.current.playbackRate = playbackSpeed;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    await audioRef.current.play();
    setIsPlaying(true);
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextSpeed = PLAYBACK_SPEEDS[(currentIndex + 1) % PLAYBACK_SPEEDS.length] ?? 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const sendRecording = async () => {
    if (!previewBlob || uploading) {
      return;
    }
    setUploading(true);
    try {
      const filename = `voice-${Date.now()}.webm`;
      const contentType = previewBlob.type || "audio/webm";
      const message = await uploadChatAttachment({
        conversationId,
        file: previewBlob,
        filename,
        contentType,
        kind: "VOICE",
        clientMessageId: randomUuid(),
        durationMs: elapsedMs,
      });
      onSent?.(message);
      resetPreview();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to send voice message");
    } finally {
      setUploading(false);
    }
  };

  const onHoldStart = () => {
    holdActiveRef.current = true;
    void startRecording();
  };

  const onHoldEnd = () => {
    if (!holdActiveRef.current) {
      return;
    }
    holdActiveRef.current = false;
    stopRecording();
  };

  const showPanel = recording || Boolean(previewBlob);

  return {
    recording,
    uploading,
    elapsedMs,
    waveform,
    previewBlob,
    showPanel,
    onHoldStart,
    onHoldEnd,
    togglePlayback,
    cyclePlaybackSpeed,
    sendRecording,
    resetPreview,
    isPlaying,
    playbackSpeed,
  };
}

export function VoiceRecorderPanel({
  recording,
  uploading,
  elapsedMs,
  waveform,
  previewBlob,
  isPlaying,
  playbackSpeed,
  onTogglePlayback,
  onCycleSpeed,
  onDiscard,
  onSend,
}: {
  recording: boolean;
  uploading: boolean;
  elapsedMs: number;
  waveform: number[];
  previewBlob: Blob | null;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onTogglePlayback: () => void;
  onCycleSpeed: () => void;
  onDiscard: () => void;
  onSend: () => void;
}) {
  return (
    <div className="border-border space-y-2 border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            recording ? "animate-pulse bg-red-500" : "bg-muted-foreground",
          )}
        />
        <span className="text-sm font-medium">
          {recording ? "Recording…" : "Voice message preview"}
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {formatDuration(elapsedMs)}
        </span>
      </div>

      {waveform.length > 0 ? (
        <div className="flex h-8 items-end gap-0.5 rounded-md bg-muted/40 px-2 py-1">
          {waveform.map((level, index) => (
            <span
              key={`${index}-${level}`}
              className="bg-primary/70 w-1 rounded-full"
              style={{ height: `${Math.max(12, level * 100)}%` }}
            />
          ))}
        </div>
      ) : null}

      {previewBlob ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void onTogglePlayback()}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Preview
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCycleSpeed}>
            {playbackSpeed}x
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>
            <Trash2 className="h-4 w-4" />
            Discard
          </Button>
          <Button type="button" size="sm" disabled={uploading} onClick={() => void onSend()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">Release the mic button to finish recording</p>
      )}
    </div>
  );
}

export function VoiceRecorderButton({
  recording,
  disabled,
  onHoldStart,
  onHoldEnd,
  className,
}: {
  recording: boolean;
  disabled?: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "ghost"}
      size="icon"
      className={cn("h-9 w-9 shrink-0 rounded-full", className)}
      aria-label={recording ? "Release to stop recording" : "Hold to record voice message"}
      disabled={disabled}
      onPointerDown={onHoldStart}
      onPointerUp={onHoldEnd}
      onPointerLeave={onHoldEnd}
      onPointerCancel={onHoldEnd}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}

export function VoiceRecorder({
  conversationId,
  disabled = false,
  onSent,
  className,
  compact = false,
}: VoiceRecorderProps) {
  const voice = useVoiceRecorder({ conversationId, disabled, onSent });

  if (compact) {
    return (
      <div className={className}>
        {voice.showPanel ? (
          <VoiceRecorderPanel
            recording={voice.recording}
            uploading={voice.uploading}
            elapsedMs={voice.elapsedMs}
            waveform={voice.waveform}
            previewBlob={voice.previewBlob}
            isPlaying={voice.isPlaying}
            playbackSpeed={voice.playbackSpeed}
            onTogglePlayback={() => void voice.togglePlayback()}
            onCycleSpeed={voice.cyclePlaybackSpeed}
            onDiscard={voice.resetPreview}
            onSend={() => void voice.sendRecording()}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <VoiceRecorderButton
          recording={voice.recording}
          disabled={disabled || voice.uploading || Boolean(voice.previewBlob)}
          onHoldStart={voice.onHoldStart}
          onHoldEnd={voice.onHoldEnd}
        />
        <span className="text-muted-foreground text-xs">
          {voice.recording
            ? "Release to finish"
            : voice.previewBlob
              ? "Review your voice note"
              : "Hold to record"}
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {formatDuration(voice.elapsedMs)}
        </span>
      </div>

      {voice.showPanel ? (
        <VoiceRecorderPanel
          recording={voice.recording}
          uploading={voice.uploading}
          elapsedMs={voice.elapsedMs}
          waveform={voice.waveform}
          previewBlob={voice.previewBlob}
          isPlaying={voice.isPlaying}
          playbackSpeed={voice.playbackSpeed}
          onTogglePlayback={() => void voice.togglePlayback()}
          onCycleSpeed={voice.cyclePlaybackSpeed}
          onDiscard={voice.resetPreview}
          onSend={() => void voice.sendRecording()}
        />
      ) : null}
    </div>
  );
}
