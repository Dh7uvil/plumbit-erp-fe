"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";

import { notificationEntityHref } from "@/modules/users-management/notifications/lib/routes";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/modules/users-management/notifications/mutations";
import { useNotifications } from "@/modules/users-management/notifications/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

export function NotificationsScreen() {
  const query = useNotifications({ page: 1, page_size: 50, sort_by: "created_at", sort_order: "desc" });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = query.data?.data ?? [];
  const hasUnread = notifications.some((item) => !item.read_at);

  if (query.isLoading && !query.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Notifications" subtitle="Your recent alerts and updates" />
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Notifications" subtitle="Your recent alerts and updates" />
        <ErrorState
          message={getErrorMessage(query.error) || "Unable to load notifications."}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Notifications"
        subtitle="Your recent alerts and updates"
        actions={
          hasUnread ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Mark all read
            </Button>
          ) : null
        }
      />
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((item) => {
            const href = notificationEntityHref(item.entity_type, item.entity_id);
            const unread = !item.read_at;
            const content = (
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-4 transition-colors",
                  unread ? "bg-muted/40 border-border" : "bg-card border-transparent",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("text-sm", unread ? "font-medium" : "text-foreground")}>
                      {item.title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
                  </div>
                  {unread ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={markRead.isPending}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        markRead.mutate(item.id);
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">{formatDateTime(item.created_at)}</p>
              </div>
            );

            if (href) {
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="block"
                  onClick={() => {
                    if (unread) {
                      markRead.mutate(item.id);
                    }
                  }}
                >
                  {content}
                </Link>
              );
            }

            return <div key={item.id}>{content}</div>;
          })}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Channel preferences are managed in{" "}
        <Link href="/settings/notifications" className="text-primary underline-offset-4 hover:underline">
          notification settings
        </Link>
        .
      </p>
    </div>
  );
}
