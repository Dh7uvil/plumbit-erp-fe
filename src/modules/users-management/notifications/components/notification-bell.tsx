"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useUnreadNotificationCount } from "@/modules/users-management/notifications/queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

export function NotificationBell() {
  const unreadQuery = useUnreadNotificationCount();
  const unread = unreadQuery.data?.count ?? 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground relative"
          asChild
        >
          <Link href="/notifications" aria-label={`${unread} unread notifications`}>
            <Bell className="size-4" />
            {unread > 0 ? (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                {unread > 99 ? "99+" : unread}
              </Badge>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}
