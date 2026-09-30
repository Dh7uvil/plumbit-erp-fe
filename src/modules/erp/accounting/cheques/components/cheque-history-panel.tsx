"use client";

import { ActivityTimeline } from "@/modules/users-management/activity/components/activity-timeline";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ChequeHistoryPanel({ chequeId }: { chequeId: string }) {
  const activityQuery = useEntityActivity("cheque", chequeId, undefined, { pageSize: 50 });
  const rows = activityQuery.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent>
        {activityQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : activityQuery.isError ? (
          <DataTableError
            message={getErrorMessage(activityQuery.error)}
            onRetry={() => activityQuery.refetch()}
          />
        ) : (
          <ActivityTimeline
            rows={rows}
            emptyTitle="No history yet"
            emptyMessage="Status changes and edits to this cheque will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
