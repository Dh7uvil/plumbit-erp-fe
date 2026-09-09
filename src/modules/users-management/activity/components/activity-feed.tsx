"use client";

import {
  formatAuditValue,
  humanizeAuditField,
} from "@/modules/users-management/audit-logs/audit-log-format";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";

function formatChangedValue(value: unknown): string {
  const formatted = formatAuditValue(value);
  if (formatted.kind === "empty") {
    return "—";
  }
  if (formatted.kind === "list") {
    return formatted.items.join(", ");
  }
  return formatted.text;
}

export function ActivityFeed({
  entityType,
  entityId,
  revision,
}: {
  entityType: string;
  entityId: string;
  revision?: number | string;
}) {
  const activityQuery = useEntityActivity(entityType, entityId, revision);
  const rows = activityQuery.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activityQuery.isLoading ? <Skeleton className="h-20 w-full" /> : null}
        {activityQuery.isError ? (
          <DataTableError
            message="Unable to load activity."
            onRetry={() => activityQuery.refetch()}
          />
        ) : null}
        {!activityQuery.isLoading && !activityQuery.isError && rows.length === 0 ? (
          <DataTableEmpty title="No activity" message="Changes to this record will appear here." />
        ) : null}
        {!activityQuery.isLoading && !activityQuery.isError && rows.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li
                key={`${row.occurred_at}-${row.action}-${index}`}
                className="rounded-md border px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{humanizeAuditField(row.action)}</p>
                  <p className="text-muted-foreground text-xs">{formatDateTime(row.occurred_at)}</p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {row.actor_name ?? "System"}
                  {row.status && row.status !== "SUCCESS"
                    ? ` · ${humanizeAuditField(row.status)}`
                    : ""}
                </p>
                {row.changed_fields.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1">
                    {row.changed_fields.map((change) => (
                      <li key={change.field} className="text-xs">
                        <span className="font-medium">{humanizeAuditField(change.field)}</span>
                        <span className="text-muted-foreground">
                          {`: ${formatChangedValue(change.old_value)} → ${formatChangedValue(change.new_value)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  );
}
