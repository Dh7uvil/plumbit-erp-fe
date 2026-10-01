"use client";

import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/cn";

export type PresenceStatus = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE" | string;

function presenceDotClass(status: PresenceStatus): string {
  switch (status) {
    case "ONLINE":
      return "bg-success";
    case "AWAY":
      return "bg-warning";
    case "BUSY":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

export function CommAvatar({
  label,
  presence,
  className,
  size = "md",
}: {
  label: string;
  presence?: PresenceStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={sizeClass}>
        <AvatarFallback className="bg-[#1a73e8] text-white font-medium">
          {label.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {presence && presence !== "OFFLINE" ? (
        <span
          className={cn(
            "border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2",
            presenceDotClass(presence),
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
