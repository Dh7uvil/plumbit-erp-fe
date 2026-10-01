"use client";

import { Phone, PhoneOff, Video } from "lucide-react";

import { CommAvatar } from "@/modules/communication/components/ui";
import type { Call } from "@/modules/communication/calls/schemas";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function IncomingCallDialog({
  call,
  open,
  callerName,
  onAccept,
  onReject,
  busy,
}: {
  call: Call | null;
  open: boolean;
  callerName?: string;
  onAccept: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  if (!call) {
    return null;
  }

  const label = callerName ?? (call.scope === "GROUP" ? "Group call" : "Incoming call");

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="mb-2 animate-pulse">
            <CommAvatar label={label} size="lg" />
          </div>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Incoming {call.kind === "VIDEO" ? "video" : "audio"} call
            {call.scope === "GROUP" ? " · Group" : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button variant="destructive" size="lg" className="rounded-full" onClick={onReject} disabled={busy}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Decline
          </Button>
          <Button size="lg" className="rounded-full" onClick={onAccept} disabled={busy}>
            {call.kind === "VIDEO" ? (
              <Video className="mr-2 h-4 w-4" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
