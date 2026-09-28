"use client";

import {
  Bookmark,
  Bug,
  MoreHorizontal,
  SquareCheck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

import {
  TASK_PRIORITY_LABELS,
  TASK_TYPE_META,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
  type TaskType,
} from "@/modules/task-management/tasks/schemas";
import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";

const TYPE_ICONS: Record<TaskType, LucideIcon> = {
  TASK: SquareCheck,
  BUG: Bug,
  STORY: Bookmark,
  EPIC: Zap,
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isOverdue(task: Task): boolean {
  if (!task.due_at || task.status === "DONE" || task.status === "CANCELLED") {
    return false;
  }
  return new Date(task.due_at).getTime() < Date.now();
}

export function TaskCard({
  task,
  focused = false,
  onOpen,
  onOpenParent,
  onAssignToMe,
  onMove,
  onDelete,
  menuOpen,
  onMenuOpenChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  cardRef,
}: {
  task: Task;
  focused?: boolean;
  onOpen: () => void;
  onOpenParent?: () => void;
  onAssignToMe?: () => void;
  onMove?: (status: TaskStatus) => void;
  onDelete?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  cardRef?: (node: HTMLDivElement | null) => void;
}) {
  const userNameById = useUserNameMap();
  const localRef = useRef<HTMLDivElement | null>(null);
  const draggable = task.available_actions.some((action) => action.startsWith("move:"));
  const TypeIcon = TYPE_ICONS[task.task_type];
  const typeMeta = TASK_TYPE_META[task.task_type];
  const assigneeName = task.assignee_id ? userNameById.get(task.assignee_id) : null;
  const checklistDone = task.checklist_items.filter((item) => item.is_done).length;
  const checklistTotal = task.checklist_items.length;

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        cardRef?.(node);
      }}
      draggable={draggable}
      tabIndex={0}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "bg-background cursor-pointer rounded-md border p-3 shadow-sm outline-none transition-shadow",
        focused && "ring-primary ring-2",
      )}
    >
      {task.parent ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mb-1 font-mono text-xs hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpenParent?.();
          }}
        >
          {task.parent.task_number}
        </button>
      ) : null}
      <div className="flex items-start gap-2">
        <TypeIcon className={cn("mt-0.5 size-4 shrink-0", typeMeta.color)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-medium">{task.title}</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">{task.task_number}</p>
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
            {onAssignToMe && task.available_actions.includes("assign") ? (
              <DropdownMenuItem onClick={onAssignToMe}>Assign to me</DropdownMenuItem>
            ) : null}
            {onMove ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {TASK_STATUSES.filter((status) =>
                    task.available_actions.includes(`move:${status}`),
                  ).map((status) => (
                    <DropdownMenuItem key={status} onClick={() => onMove(status)}>
                      {TASK_STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}
            {onDelete && task.available_actions.includes("delete") ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {task.labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <Badge key={label.id} variant="secondary" className="text-xs">
              {label.name}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <span className="text-muted-foreground text-xs">{TASK_PRIORITY_LABELS[task.priority]}</span>
        {task.due_at ? (
          <span className={cn("text-xs", isOverdue(task) && "text-destructive font-medium")}>
            Due {formatDateTime(task.due_at)}
          </span>
        ) : null}
        {task.subtask_count > 0 ? (
          <span className="text-muted-foreground text-xs">
            {task.subtask_done_count}/{task.subtask_count} subtasks
          </span>
        ) : null}
        {checklistTotal > 0 ? (
          <span className="text-muted-foreground text-xs">
            {checklistDone}/{checklistTotal}
          </span>
        ) : null}
        {assigneeName ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="ml-auto size-6">
                <AvatarFallback className="text-[10px]">{initials(assigneeName)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{assigneeName}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
