"use client";

import Link from "next/link";

import { CommAvatar, type PresenceStatus } from "@/modules/communication/components/ui/comm-avatar";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";

export function CommListItem({
  href,
  title,
  preview,
  time,
  unreadCount = 0,
  avatarLabel,
  presence,
  isActive = false,
  onClick,
}: {
  href?: string;
  title: string;
  preview?: string | null;
  time?: string | null;
  unreadCount?: number;
  avatarLabel: string;
  presence?: PresenceStatus;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {isActive ? (
        <span className={cn("absolute top-2 bottom-2 left-0 w-1 rounded-r-full", commTheme.listActiveBar)} />
      ) : null}
      <CommAvatar
        label={avatarLabel}
        presence={presence}
        className={cn("col-start-1 self-center", preview ? "row-span-2" : "row-span-1")}
      />
      <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-between gap-2">
        <p className={cn("truncate text-sm leading-tight", unreadCount > 0 ? "font-semibold" : "font-medium")}>
          {title}
        </p>
        {time ? (
          <span
            className={cn(
              "shrink-0 text-xs leading-tight",
              unreadCount > 0 ? "font-medium text-[#1a73e8]" : "text-muted-foreground",
            )}
          >
            {time}
          </span>
        ) : null}
      </div>
      {preview ? (
        <p
          className={cn(
            "col-start-2 row-start-2 min-w-0 truncate text-xs leading-tight",
            unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {preview}
        </p>
      ) : null}
      {unreadCount > 0 ? (
        <Badge
          className={cn(
            "col-start-3 h-5 min-w-5 shrink-0 justify-center self-center rounded-full bg-[#1a73e8] px-1.5 text-[10px] hover:bg-[#1a73e8]",
            preview ? "row-span-2" : "row-span-1",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      ) : null}
    </>
  );

  const className = cn(
    "relative grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-0.5 rounded-r-xl py-2.5 pr-3 pl-3 transition-colors",
    "hover:bg-[#f1f3f4] dark:hover:bg-muted/60",
    isActive && commTheme.listActive,
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={cn(className, "w-full text-left")} onClick={onClick}>
      {content}
    </button>
  );
}

export function CommListItemSkeleton() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5">
      <div className="bg-muted col-start-1 row-span-2 h-9 w-9 shrink-0 animate-pulse self-center rounded-full" />
      <div className="bg-muted col-start-2 row-start-1 h-3 w-3/4 animate-pulse rounded" />
      <div className="bg-muted col-start-2 row-start-2 h-2.5 w-1/2 animate-pulse rounded" />
    </div>
  );
}

export function CommListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0.5 px-1 py-2">
      {Array.from({ length: count }).map((_, index) => (
        <CommListItemSkeleton key={index} />
      ))}
    </div>
  );
}
