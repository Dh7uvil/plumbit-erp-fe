"use client";

import { Loader2, Paperclip, X } from "lucide-react";
import { useRef } from "react";

import { useChatAttachmentUpload } from "@/modules/communication/hooks/use-chat-attachment-upload";
import type { Message } from "@/modules/communication/messages/schemas";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export type AttachmentPickerProps = {
  conversationId: string;
  disabled?: boolean;
  onUploaded?: (message: Message) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  className?: string;
  /** Icon-only button for the composer bar (default). */
  compact?: boolean;
  uploads?: ReturnType<typeof useChatAttachmentUpload>["uploads"];
  onFilesSelected?: (files: FileList | File[] | null | undefined) => void;
};

export function AttachmentUploadList({
  uploads,
  onDismiss,
}: {
  uploads: Array<{ id: string; filename: string; progress: number }>;
  onDismiss?: (id: string) => void;
}) {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1.5 px-3 pt-2">
      {uploads.map((upload) => (
        <li
          key={upload.id}
          className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <Loader2 className="text-primary h-4 w-4 shrink-0 animate-spin" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{upload.filename}</p>
            <div className="bg-muted mt-1 h-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {upload.progress}%
          </span>
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label="Dismiss upload"
              onClick={() => onDismiss(upload.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function AttachmentPicker({
  conversationId,
  disabled = false,
  onUploaded,
  onUploadStart,
  onUploadEnd,
  className,
  compact = true,
  uploads: externalUploads,
  onFilesSelected,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const internal = useChatAttachmentUpload({
    conversationId,
    onUploaded,
    onUploadStart,
    onUploadEnd,
  });

  const uploads = externalUploads ?? internal.uploads;
  const handleFiles = onFilesSelected ?? internal.uploadFiles;
  const isBusy = disabled || uploads.length > 0;

  if (!compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <AttachmentUploadList uploads={uploads} />
        <div className="border-border flex items-center gap-2 rounded-lg border border-dashed p-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            disabled={isBusy}
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Choose files
          </Button>
          <span className="text-muted-foreground text-xs">or drag files into the chat</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={isBusy}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 shrink-0", className)}
        aria-label="Attach file"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  );
}
