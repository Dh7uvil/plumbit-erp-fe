"use client";

import Link from "next/link";
import { TaskDetailContent } from "@/modules/task-management/tasks/components/task-detail-content";
import { TaskForm } from "@/modules/task-management/tasks/components/task-form";
import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { useTask } from "@/modules/task-management/tasks/queries";
import { TASK_PRIORITY_LABELS } from "@/modules/task-management/tasks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function TaskDetailScreen({ taskId, mode }: { taskId: string; mode: RecordPageMode }) {
  const { canUpdate, canCreate } = useCrudPermissions(taskPermissions);
  const taskQuery = useTask(taskId);

  if (taskQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={taskQuery.error ? getErrorMessage(taskQuery.error) : "Task not found"}
          onRetry={() => taskQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  const task = taskQuery.data;
  const isEdit = mode === "edit";
  const canEdit = canUpdate;

  return (
    <div className="flex flex-col gap-4">
      <RecordPageHeader
        title={task.title}
        code={task.task_number}
        badges={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {TASK_PRIORITY_LABELS[task.priority]}
            </span>
            <TaskStatusBadge status={task.status} />
          </div>
        }
        mode={mode}
        viewHref={`/tasks/${taskId}`}
        editHref={`/tasks/${taskId}/edit`}
        listHref="/tasks"
        canUpdate={canEdit}
      />
      {isEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm task={task} disabled={!canEdit} onSuccess={() => window.history.back()} />
          </CardContent>
        </Card>
      ) : (
        <TaskDetailContent task={task} canEdit={canEdit} canCreateSubtask={canCreate} />
      )}
    </div>
  );
}
