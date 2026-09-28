"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { useCreateTask } from "@/modules/task-management/tasks/mutations";
import { useTasks } from "@/modules/task-management/tasks/queries";
import { TASK_TYPE_META, type Task, type TaskType } from "@/modules/task-management/tasks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Bookmark, Bug, SquareCheck, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const TYPE_ICONS: Record<TaskType, LucideIcon> = {
  TASK: SquareCheck,
  BUG: Bug,
  STORY: Bookmark,
  EPIC: Zap,
};

export function TaskSubtasksPanel({
  task,
  canCreate,
  onOpenTask,
}: {
  task: Task;
  canCreate: boolean;
  onOpenTask: (taskId: string) => void;
}) {
  const createTask = useCreateTask();
  const userNameById = useUserNameMap();
  const [draftTitle, setDraftTitle] = useState("");
  const [pending, setPending] = useState(false);
  const subtasksQuery = useTasks({
    parent_id: task.id,
    page: 1,
    page_size: 100,
    sort_by: "sort_order",
    sort_order: "asc",
  });
  const rows = subtasksQuery.data?.data ?? [];

  async function addSubtask() {
    const trimmed = draftTitle.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      await createTask.mutateAsync({ title: trimmed, parent_id: task.id });
      setDraftTitle("");
      toast.success("Subtask created");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Subtasks</CardTitle>
        {task.subtask_count > 0 ? (
          <span className="text-muted-foreground text-sm">
            {task.subtask_done_count}/{task.subtask_count} done
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {subtasksQuery.isLoading ? <Loader2 className="mx-auto animate-spin" /> : null}
        {rows.map((row) => {
          const TypeIcon = TYPE_ICONS[row.task_type];
          const meta = TASK_TYPE_META[row.task_type];
          return (
            <button
              key={row.id}
              type="button"
              className="hover:bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-left"
              onClick={() => onOpenTask(row.id)}
            >
              <TypeIcon className={cn("size-4 shrink-0", meta.color)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <p className="text-muted-foreground font-mono text-xs">{row.task_number}</p>
              </div>
              <TaskStatusBadge status={row.status} />
              {row.assignee_id ? (
                <span className="text-muted-foreground text-xs">
                  {userNameById.get(row.assignee_id) ?? "Assignee"}
                </span>
              ) : null}
            </button>
          );
        })}
        {canCreate ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void addSubtask();
            }}
          >
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Add subtask…"
              disabled={pending}
            />
            <Button type="submit" size="icon-sm" variant="outline" disabled={pending || !draftTitle.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
