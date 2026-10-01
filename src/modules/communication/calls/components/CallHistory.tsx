"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CommAvatar, CommEmptyState, CommErrorState } from "@/modules/communication/components/ui";
import { useCalls } from "@/modules/communication/calls/queries";
import type { Call, CallKind } from "@/modules/communication/calls/schemas";
import { useConversations } from "@/modules/communication/conversations/queries";
import { conversationLabel } from "@/modules/communication/shared/conversation-label";
import {
  buildConversationUserNames,
  useUserDirectory,
} from "@/modules/communication/shared/use-user-directory";
import {
  callHistorySummary,
  callHistoryTitle,
  formatCallDuration,
} from "@/modules/communication/shared/call-label";
import { useMe } from "@/modules/users-management/auth/queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

type CallFilter = "all" | "missed" | "outgoing";

function CallRow({
  call,
  title,
  summary,
}: {
  call: Call;
  title: string;
  summary: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-[#f8f9fa] dark:bg-card dark:hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <CommAvatar label={title} size="md" className="bg-[#e8f0fe] dark:bg-muted" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{summary}</p>
          <p className="text-muted-foreground text-xs">{formatDateTime(call.started_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={call.status === "MISSED" ? "destructive" : "secondary"}>
          {call.status}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/chat/${call.conversation_id}`}>Open chat</Link>
        </Button>
      </div>
    </div>
  );
}

export function formatCallBubbleText(
  kind: CallKind,
  durationSeconds: number | null,
  missed: boolean,
) {
  if (missed) {
    return `Missed ${kind === "VIDEO" ? "video" : "audio"} call`;
  }
  const duration = formatCallDuration(durationSeconds);
  const label = kind === "VIDEO" ? "Video call" : "Audio call";
  return duration ? `${label} ${duration}` : label;
}

export function CallHistory() {
  const { data: me } = useMe();
  const { byId } = useUserDirectory();
  const [filter, setFilter] = useState<CallFilter>("all");
  const { data, isLoading, isError, refetch } = useCalls({
    page_size: 50,
    sort_by: "started_at",
    sort_order: "desc",
  });
  const { data: conversationsData } = useConversations({ page_size: 100 });

  const userNames = useMemo(
    () => buildConversationUserNames(byId, me),
    [byId, me],
  );

  const conversationTitles = useMemo(() => {
    const map = new Map<string, string>();
    if (!me) {
      return map;
    }
    for (const conversation of conversationsData?.data ?? []) {
      map.set(conversation.id, conversationLabel(conversation, me.id, userNames));
    }
    return map;
  }, [conversationsData?.data, me, userNames]);

  const calls = useMemo(() => {
    const rows = data?.data ?? [];
    if (filter === "missed") {
      return rows.filter((call) => call.status === "MISSED");
    }
    if (filter === "outgoing") {
      return rows.filter((call) => call.status === "RINGING" || call.status === "ENDED");
    }
    return rows;
  }, [data?.data, filter]);

  const filters: { id: CallFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "missed", label: "Missed" },
    { id: "outgoing", label: "Recent" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <PageHeader
        title="Call history"
        subtitle="Recent, missed, and completed calls across your organization."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat/settings">Communication settings</Link>
          </Button>
        }
      />

      <div className="flex gap-1">
        {filters.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={filter === item.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-7 rounded-full px-3 text-xs")}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <CommErrorState onRetry={() => void refetch()} />
      ) : calls.length === 0 ? (
        <CommEmptyState
          title="No calls yet"
          message="Your call history will appear here after you make or receive calls."
        />
      ) : (
        <div className="space-y-2">
          {calls.map((call) => (
            <CallRow
              key={call.id}
              call={call}
              title={
                me
                  ? callHistoryTitle(call, me.id, userNames, conversationTitles)
                  : "Call"
              }
              summary={me ? callHistorySummary(call, me.id) : callHistorySummary(call, "")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
