"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActivityFormDialog } from "@/modules/crm/activities/components/activity-form-dialog";
import { ActivityStatusBadge } from "@/modules/crm/activities/components/activity-status-badge";
import { useCompleteActivity, useDeleteActivity } from "@/modules/crm/activities/mutations";
import { activityPermissions } from "@/modules/crm/activities/permissions";
import { useActivities } from "@/modules/crm/activities/queries";
import {
  ACTIVITY_PRIORITY_LABELS,
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type CrmRelatedEntityType,
} from "@/modules/crm/activities/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";

export function ActivityTimeline({
  entityType,
  entityId,
}: {
  entityType: CrmRelatedEntityType;
  entityId: string;
}) {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(activityPermissions);
  const listQuery = useActivities({
    page: 1,
    page_size: 50,
    sort_by: "due_at",
    sort_order: "asc",
    related_entity_type: entityType,
    related_entity_id: entityId,
  });
  const completeActivity = useCompleteActivity();
  const deleteActivity = useDeleteActivity();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const rows = listQuery.data?.data ?? [];

  async function onComplete(row: Activity) {
    try {
      await completeActivity.mutateAsync({ id: row.id });
      toast.success("Activity completed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteActivity.mutateAsync(deleting.id);
      toast.success("Activity deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Activities</CardTitle>
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" />
            New activity
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {listQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : listQuery.isError ? (
          <DataTableError
            message={getErrorMessage(listQuery.error)}
            onRetry={() => listQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <DataTableEmpty
            title="No activities"
            message={emptyListMessage(canCreate, "Schedule a task, call, or meeting.")}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id} className="border-border rounded-md border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{row.subject}</p>
                    <p className="text-muted-foreground text-sm">
                      {ACTIVITY_TYPE_LABELS[row.activity_type]} ·{" "}
                      {ACTIVITY_PRIORITY_LABELS[row.priority]}
                      {row.due_at ? ` · due ${formatDateTime(row.due_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ActivityStatusBadge status={row.status} />
                    {canUpdate && row.available_actions.includes("complete") ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={`Complete ${row.subject}`}
                        disabled={completeActivity.isPending}
                        onClick={() => void onComplete(row)}
                      >
                        <Check className="size-3.5" />
                        Complete
                      </Button>
                    ) : null}
                    {canDelete && row.available_actions.includes("delete") ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${row.subject}`}
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        related={{ type: entityType, id: entityId }}
        relatedLocked
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete activity"
        description={deleting ? `Delete ${deleting.subject}? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        pending={deleteActivity.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
