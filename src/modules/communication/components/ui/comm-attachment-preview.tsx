"use client";

import { FileText, Mic, Play, Video } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export type CommAttachmentPreviewProps = {
  filename: string;
  contentType: string;
  sizeBytes?: number;
  thumbnailUrl?: string | null;
  variant?: "bubble" | "grid";
  className?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommAttachmentPreview({
  filename,
  contentType,
  sizeBytes,
  thumbnailUrl,
  variant = "bubble",
  className,
}: CommAttachmentPreviewProps) {
  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");
  const isAudio = contentType.startsWith("audio/");

  if (variant === "grid" && thumbnailUrl && (isImage || isVideo)) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailUrl} alt={filename} className="h-full w-full object-cover" />
        {isVideo ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play className="h-8 w-8 fill-white text-white" />
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2",
          className,
        )}
      >
        {isVideo ? <Video className="h-6 w-6" /> : isAudio ? <Mic className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
        <span className="line-clamp-2 text-center text-[10px] leading-tight">{filename}</span>
      </div>
    );
  }

  return (
    <div className={cn("min-w-[10rem]", className)}>
      {thumbnailUrl && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={filename}
          className="mb-2 max-h-52 w-full cursor-pointer rounded-lg object-cover"
        />
      ) : isVideo ? (
        <div className="bg-muted/80 text-muted-foreground mb-2 flex aspect-video max-h-52 w-full min-w-[12rem] items-center justify-center rounded-lg">
          <Play className="h-10 w-10 opacity-70" />
        </div>
      ) : (
        <div className="bg-muted/60 text-muted-foreground mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
          {isAudio ? <Mic className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
          <span className="truncate text-xs">{isAudio ? "Voice message" : "Document"}</span>
        </div>
      )}
      <p className="font-medium underline-offset-2 hover:underline">{filename}</p>
      {sizeBytes != null ? (
        <p className="text-muted-foreground text-xs">{formatFileSize(sizeBytes)}</p>
      ) : null}
    </div>
  );
}
