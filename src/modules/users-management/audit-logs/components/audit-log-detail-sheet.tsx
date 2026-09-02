"use client";

import { AuditLogChanges } from "@/modules/users-management/audit-logs/components/audit-log-changes";
import { useAuditLog } from "@/modules/users-management/audit-logs/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime, titleCase } from "@/shared/lib/format";

type ActionBadgeVariant = "success" | "info" | "destructive" | "muted" | "default" | "warning";

function actionVariant(action: string): ActionBadgeVariant {
  switch (action.toUpperCase()) {
    case "CREATE":
    case "APPROVE":
    case "POST":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "destructive";
    case "REJECT":
    case "CANCEL":
      return "warning";
    case "LOGIN":
    case "LOGOUT":
      return "default";
    default:
      return "muted";
  }
}

function statusVariant(status: string): "success" | "destructive" | "muted" {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "destructive";
    default:
      return "muted";
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}

export function AuditLogDetailSheet({
  logId,
  onOpenChange,
}: {
  logId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useAuditLog(logId);
  const log = detailQuery.data;

  return (
    <Sheet open={Boolean(logId)} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {log ? (
              <>
                <Badge variant={actionVariant(log.action)}>{titleCase(log.action)}</Badge>
                <span>{titleCase(log.entity_type)}</span>
              </>
            ) : (
              "Audit log"
            )}
          </SheetTitle>
          <SheetDescription>
            {log ? formatDateTime(log.timestamp) : "Who, when, and what changed"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : null}
          {detailQuery.isError ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm">{getErrorMessage(detailQuery.error)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => detailQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : null}
          {log ? (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <InfoRow label="User" value={log.user?.name ?? "Unknown"} />
                <InfoRow label="Module" value={titleCase(log.module)} />
                <InfoRow label="Entity ID" value={log.entity_id ?? "—"} />
                <InfoRow label="IP address" value={log.ip_address ?? "—"} />
                <div className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariant(log.status)}>{titleCase(log.status)}</Badge>
                </div>
                <InfoRow label="User agent" value={log.user_agent ?? "—"} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Changes</p>
                <AuditLogChanges changes={log.changes} />
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
