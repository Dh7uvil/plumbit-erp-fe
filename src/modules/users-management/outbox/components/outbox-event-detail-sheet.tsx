"use client";

import { useOutboxEvent } from "@/modules/users-management/outbox/queries";
import { OUTBOX_STATUS_LABELS } from "@/modules/users-management/outbox/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Badge } from "@/shared/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime, humanizeEnum } from "@/shared/lib/format";

function statusVariant(status: string): "success" | "destructive" | "warning" | "muted" | "info" {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return "success";
    case "FAILED":
    case "DEAD":
      return "destructive";
    case "PROCESSING":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "muted";
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}

function payloadText(value: unknown): string {
  if (value == null) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function OutboxEventDetailSheet({
  eventId,
  onOpenChange,
}: {
  eventId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useOutboxEvent(eventId);
  const event = detailQuery.data;

  return (
    <Sheet open={Boolean(eventId)} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {event ? (
              <>
                <Badge variant={statusVariant(event.status)}>
                  {OUTBOX_STATUS_LABELS[event.status] ?? humanizeEnum(event.status)}
                </Badge>
                <span>{humanizeEnum(event.event_type)}</span>
              </>
            ) : (
              "Outbox event"
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {detailQuery.isLoading ? (
            <>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : detailQuery.isError ? (
            <p className="text-destructive text-sm">{getErrorMessage(detailQuery.error)}</p>
          ) : event ? (
            <>
              <InfoRow label="ID" value={event.id} />
              <InfoRow label="Event" value={event.event_type} />
              <InfoRow label="Aggregate" value={event.aggregate_type || "—"} />
              <InfoRow label="Aggregate ID" value={event.aggregate_id ?? "—"} />
              <InfoRow label="Attempts" value={String(event.attempts)} />
              <InfoRow label="Created" value={formatDateTime(event.created_at)} />
              <InfoRow
                label="Available at"
                value={event.available_at ? formatDateTime(event.available_at) : "—"}
              />
              {event.last_error ? <InfoRow label="Last error" value={event.last_error} /> : null}
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-sm">Payload</span>
                <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
                  {payloadText(event.payload)}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
