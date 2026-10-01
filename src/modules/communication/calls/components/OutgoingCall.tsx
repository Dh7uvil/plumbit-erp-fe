"use client";

import { PhoneOff, Video } from "lucide-react";
import { useEffect } from "react";

import { startRingback, stopRingback } from "@/modules/communication/calls/call-sounds";
import { CommAvatar } from "@/modules/communication/components/ui";
import type { Call } from "@/modules/communication/calls/schemas";
import { Button } from "@/shared/components/ui/button";

export function OutgoingCall({
  call,
  calleeName,
  onCancel,
  error,
}: {
  call: Call;
  calleeName?: string;
  onCancel: () => void;
  error?: string | null;
}) {
  const label = calleeName ?? (call.scope === "GROUP" ? "Group" : "Contact");

  useEffect(() => {
    startRingback();
    return () => {
      stopRingback();
    };
  }, []);

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <CommAvatar label={label} size="lg" className="scale-125" />
          <span className="border-background bg-primary absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2">
            {call.kind === "VIDEO" ? (
              <Video className="text-primary-foreground h-4 w-4" />
            ) : (
              <PhoneOff className="text-primary-foreground h-4 w-4 rotate-[135deg]" />
            )}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold">{label}</p>
          <p className="text-muted-foreground text-sm">
            {call.scope === "GROUP" ? "Calling group…" : "Calling…"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {call.kind === "VIDEO" ? "Video call" : "Audio call"} · Ringing
          </p>
          {error ? (
            <p className="text-destructive mt-2 text-sm">{error}</p>
          ) : null}
        </div>
      </div>
      <Button variant="destructive" size="lg" className="rounded-full px-8" onClick={onCancel}>
        <PhoneOff className="mr-2 h-4 w-4" />
        Cancel call
      </Button>
    </div>
  );
}
