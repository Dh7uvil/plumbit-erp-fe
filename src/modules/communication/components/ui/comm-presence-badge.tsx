"use client";

import { cn } from "@/shared/lib/cn";

import type { PresenceStatus } from "./comm-avatar";

function presenceLabel(status: PresenceStatus): string {
  switch (status) {
    case "ONLINE":
      return "Online";
    case "AWAY":
      return "Away";
    case "BUSY":
      return "Busy";
    default:
      return "Offline";
  }
}

function presenceTextClass(status: PresenceStatus): string {
  switch (status) {
    case "ONLINE":
      return "text-success";
    case "AWAY":
      return "text-warning";
    case "BUSY":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

export function CommPresenceBadge({
  status,
  lastSeen,
  className,
}: {
  status: PresenceStatus;
  lastSeen?: string | null;
  className?: string;
}) {
  const label =
    status === "OFFLINE" && lastSeen
      ? `Last seen ${new Date(lastSeen).toLocaleString()}`
      : presenceLabel(status);

  return (
    <span className={cn("text-xs", presenceTextClass(status), className)}>{label}</span>
  );
}
