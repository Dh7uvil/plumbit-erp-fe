"use client";

import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function CommMediaLightbox({
  open,
  onOpenChange,
  src,
  alt,
  contentType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt: string;
  contentType?: string;
}) {
  const isVideo = contentType?.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative flex items-center justify-center">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={() => onOpenChange(false)}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
          {src && isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={src} controls className="max-h-[85vh] max-w-full rounded-lg" />
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
