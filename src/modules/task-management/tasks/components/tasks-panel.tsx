"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import { TaskFormDialog } from "@/modules/task-management/tasks/components/task-form-dialog";
import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { useTasks } from "@/modules/task-management/tasks/queries";
import type { TaskRelatedEntityType } from "@/modules/task-management/tasks/schemas";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDateTime } from "@/shared/lib/format";

export function TasksPanel({
  entityType,
  entityId,
}: {
  entityType: TaskRelatedEntityType;
  entityId: string;
}) {
  const { canCreate, canRead } = useCrudPermissions(taskPermissions);
  const [formOpen, setFormOpen] = useState(false);
  const tasksQuery = useTasks({
    page: 1,
    page_size: 10,
    related_entity_type: entityType,
    related_entity_id: entityId,
    sort_by: "due_at",
    sort_order: "asc",
  });

  if (!canRead) return null;

  const rows = tasksQuery.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Add task
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {tasksQuery.isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {tasksQuery.isError ? <DataTableError message="Could not load tasks." /> : null}
        {!tasksQuery.isLoading && !tasksQuery.isError ? (
          <DataTable variant="embedded">
            <TableHeader>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <DataTableEmpty message="No tasks linked to this record yet." />
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/tasks/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                      <p className="text-muted-foreground font-mono text-xs">{row.task_number}</p>
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>{row.due_at ? formatDateTime(row.due_at) : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        ) : null}
      </CardContent>
      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        relatedLocked
        initialValues={{
          related_entity_type: entityType,
          related_entity_id: entityId,
        }}
      />
    </Card>
  );
}
