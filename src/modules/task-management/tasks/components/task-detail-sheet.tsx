"use client";

import Link from "next/link";
import { Bookmark, Bug, ExternalLink, SquareCheck, Zap, type LucideIcon } from "lucide-react";

import { TaskDetailContent } from "@/modules/task-management/tasks/components/task-detail-content";
import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { useMoveTask } from "@/modules/task-management/tasks/mutations";
import { useTask } from "@/modules/task-management/tasks/queries";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_TYPE_META,
  type TaskType,
} from "@/modules/task-management/tasks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";
import { toast } from "sonner";

const TYPE_ICONS: Record<TaskType, LucideIcon> = {
  TASK: SquareCheck,
  BUG: Bug,
  STORY: Bookmark,
  EPIC: Zap,
};

export function TaskDetailSheet({
  taskId,
  onOpenChange,
  onOpenTask,
  canEdit,
  canCreate,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenTask: (nextTaskId: string) => void;
  canEdit: boolean;
  canCreate: boolean;
}) {
  const taskQuery = useTask(taskId);
  const moveTask = useMoveTask();
  const task = taskQuery.data;
  const TypeIcon = task ? TYPE_ICONS[task.task_type] : SquareCheck;
  const typeMeta = task ? TASK_TYPE_META[task.task_type] : TASK_TYPE_META.TASK;

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-4 py-4 pr-12">
          {taskQuery.isLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : task ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <TypeIcon className={cn("size-4", typeMeta.color)} />
                <SheetTitle className="text-left text-base">{task.title}</SheetTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">{task.task_number}</span>
                <TaskStatusBadge status={task.status} />
                <span className="text-muted-foreground text-xs">
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
                {task.parent ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground text-xs hover:underline"
                    onClick={() => onOpenTask(task.parent!.id)}
                  >
                    Parent: {task.parent.task_number}
                  </button>
                ) : null}
                <Button type="button" variant="outline" size="xs" asChild className="ml-auto">
                  <Link href={`/tasks/${task.id}`}>
                    Open full page
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
              {canEdit ? (
                <Select
                  value={task.status}
                  onValueChange={(value) => {
                    void moveTask
                      .mutateAsync({
                        id: task.id,
                        values: {
                          status: value as (typeof TASK_STATUSES)[number],
                          sort_order: task.sort_order,
                        },
                      })
                      .catch((error) => toast.error(getErrorMessage(error)));
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TASK_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {taskQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
          {task ? (
            <TaskDetailContent
              task={task}
              canEdit={canEdit}
              canCreateSubtask={canCreate}
              onOpenTask={onOpenTask}
              variant="sheet"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
