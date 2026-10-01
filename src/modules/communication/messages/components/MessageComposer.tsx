"use client";

import { Send, X } from "lucide-react";
import { useCallback, useState, type ClipboardEvent, type DragEvent } from "react";

import { AttachmentPicker, AttachmentUploadList } from "@/modules/communication/components/AttachmentPicker";
import { EmojiPicker } from "@/modules/communication/components/EmojiPicker";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import {
  useVoiceRecorder,
  VoiceRecorderButton,
  VoiceRecorderPanel,
} from "@/modules/communication/components/VoiceRecorder";
import { useChatAttachmentUpload } from "@/modules/communication/hooks/use-chat-attachment-upload";
import type { Message } from "@/modules/communication/messages/schemas";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/cn";

export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
  onTyping,
  replyTo,
  onClearReply,
  isSending,
  isUploading,
  conversationId,
  onMessageUploaded,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  replyTo?: Message | null;
  onClearReply?: () => void;
  isSending?: boolean;
  isUploading?: boolean;
  conversationId?: string;
  onMessageUploaded?: (message: Message) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const attachmentUpload = useChatAttachmentUpload({
    conversationId: conversationId ?? "",
    onUploaded: onMessageUploaded,
  });
  const voice = useVoiceRecorder({
    conversationId: conversationId ?? "",
    disabled: !conversationId,
    onSent: onMessageUploaded,
  });

  const handleFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!conversationId) {
        return;
      }
      attachmentUpload.uploadFiles(files);
    },
    [attachmentUpload, conversationId],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const files = event.clipboardData.files;
    if (!files.length) {
      return;
    }
    event.preventDefault();
    handleFiles(files);
  };

  const busy =
    isSending || isUploading || attachmentUpload.isUploading || voice.uploading || voice.recording;
  const canSend = Boolean(draft.trim()) && !busy;

  return (
    <div
      className={cn("relative z-10 shrink-0", commTheme.composerBar)}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!busy && conversationId) {
          setDragActive(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy && conversationId) {
          setDragActive(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
          return;
        }
        setDragActive(false);
      }}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      {dragActive ? (
        <div className="border-[#1a73e8] bg-[#e8f0fe]/80 pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed">
          <p className="text-[#1a73e8] text-sm font-medium">Drop files to attach</p>
        </div>
      ) : null}

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

      {conversationId ? (
        <AttachmentUploadList uploads={attachmentUpload.uploads} />
      ) : null}

      {replyTo ? (
        <div className="mx-4 mt-2 flex items-center justify-between rounded-lg border border-[#1a73e8]/30 bg-[#e8f0fe]/50 px-3 py-2 text-sm dark:bg-blue-950/20">
          <div className="min-w-0 border-l-[3px] border-[#1a73e8] pl-2">
            <p className="text-[#1a73e8] text-xs font-medium">Replying to</p>
            <p className="truncate">{replyTo.body ?? "Attachment"}</p>
          </div>
          {onClearReply ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onClearReply}
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-end gap-2 px-4 py-3">
        {conversationId ? (
          <AttachmentPicker
            conversationId={conversationId}
            disabled={busy}
            compact
            uploads={attachmentUpload.uploads}
            onFilesSelected={handleFiles}
            onUploaded={onMessageUploaded}
          />
        ) : null}

        <div className="relative flex min-w-0 flex-1 items-end rounded-3xl border border-border/60 bg-[#f1f3f4] pr-1 pl-1 dark:bg-muted/40">
          <Textarea
            value={draft}
            onChange={(event) => {
              onDraftChange(event.target.value);
              onTyping();
            }}
            placeholder="Type a message"
            rows={1}
            className={cn(
              "max-h-32 min-h-10 w-full resize-none border-0 bg-transparent py-2.5 pr-9 pl-3 shadow-none",
              "text-sm leading-snug [field-sizing:content] focus-visible:ring-0",
            )}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  onSend();
                }
              }
            }}
          />
          <div className="absolute right-0.5 bottom-0.5">
            <EmojiPicker
              onSelect={(emoji) => onDraftChange(draft + emoji)}
              disabled={busy}
              className="h-8 w-8"
            />
          </div>
        </div>

        {canSend ? (
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-[#1a73e8] hover:bg-[#1765cc]"
            onClick={onSend}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : conversationId ? (
          <VoiceRecorderButton
            recording={voice.recording}
            disabled={busy || Boolean(voice.previewBlob)}
            onHoldStart={voice.onHoldStart}
            onHoldEnd={voice.onHoldEnd}
          />
        ) : null}
      </div>
    </div>
  );
}
