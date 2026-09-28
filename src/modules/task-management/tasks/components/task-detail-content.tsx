"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { TaskChecklistPanel } from "@/modules/task-management/tasks/components/task-checklist-panel";
import { TaskCommentsPanel } from "@/modules/task-management/tasks/components/task-comments-panel";
import { TaskSubtasksPanel } from "@/modules/task-management/tasks/components/task-subtasks-panel";
import { useSetTaskLabels, useSetTaskWatchers } from "@/modules/task-management/tasks/mutations";
import { relatedEntityHref, type Task } from "@/modules/task-management/tasks/schemas";
import { useAllTaskLabels } from "@/modules/task-management/task-labels/queries";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { ActivityTimeline } from "@/modules/users-management/activity/components/activity-timeline";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatDateTime } from "@/shared/lib/format";

export function TaskDetailContent({
  task,
  canEdit,
  canCreateSubtask,
  onOpenTask,
  variant = "page",
}: {
  task: Task;
  canEdit: boolean;
  canCreateSubtask: boolean;
  onOpenTask?: (taskId: string) => void;
  variant?: "page" | "sheet";
}) {
  const activityQuery = useEntityActivity("task", task.id, undefined, { pageSize: 50 });
  const labelsQuery = useAllTaskLabels();
  const usersQuery = useAllUsers();
  const setLabels = useSetTaskLabels();
  const setWatchers = useSetTaskWatchers();
  const [labelIds, setLabelIds] = useState<string[] | null>(null);
  const [watcherIds, setWatcherIds] = useState<string[] | null>(null);
  const selectedLabelIds = labelIds ?? task.labels.map((label) => label.id);
  const selectedWatcherIds = watcherIds ?? task.watcher_ids;

  return (
    <div className={variant === "sheet" ? "flex flex-col gap-4" : "flex flex-col gap-4"}>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Due</p>
            <p>{task.due_at ? formatDateTime(task.due_at) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Related record</p>
            <p>
              {task.related_entity_type && task.related_entity_id ? (
                <Link
                  href={relatedEntityHref(task.related_entity_type, task.related_entity_id)}
                  className="hover:underline"
                >
                  {task.related_entity_type}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          {task.description ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-xs">Description</p>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Labels & watchers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Labels</p>
            <MultiSelect
              options={(labelsQuery.data ?? []).map((label) => ({
                value: label.id,
                label: label.name,
              }))}
              value={selectedLabelIds}
              onValueChange={(value) => {
                setLabelIds(value);
                void setLabels
                  .mutateAsync({ id: task.id, labelIds: value })
                  .then(() => toast.success("Labels updated"))
                  .catch((error) => toast.error(getErrorMessage(error)));
              }}
              disabled={!canEdit}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Watchers</p>
            <MultiSelect
              options={(usersQuery.data ?? []).map((user) => ({
                value: user.id,
                label: user.name || user.email,
              }))}
              value={selectedWatcherIds}
              onValueChange={(value) => {
                setWatcherIds(value);
                void setWatchers
                  .mutateAsync({ id: task.id, watcherIds: value })
                  .then(() => toast.success("Watchers updated"))
                  .catch((error) => toast.error(getErrorMessage(error)));
              }}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>
      {onOpenTask ? (
        <TaskSubtasksPanel task={task} canCreate={canCreateSubtask} onOpenTask={onOpenTask} />
      ) : null}
      <EntityAttachmentsPanel entityType="TASK" entityId={task.id} />
      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="checklist" className="mt-4">
          <TaskChecklistPanel task={task} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
          <TaskCommentsPanel taskId={task.id} canCreate={canEdit} canDelete={canEdit} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ActivityTimeline
            rows={activityQuery.data?.data ?? []}
            emptyTitle="No history yet"
            emptyMessage="Changes to this task will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
