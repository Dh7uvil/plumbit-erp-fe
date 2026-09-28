"use client";

import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  applyPendingMove,
  computeDropIndex,
  type PendingMove,
} from "@/modules/task-management/tasks/board-overlay";
import { TaskBoardSwimlanes } from "@/modules/task-management/tasks/components/task-board-swimlanes";
import { TaskCard } from "@/modules/task-management/tasks/components/task-card";
import { useCreateTask, useMoveTask } from "@/modules/task-management/tasks/mutations";
import { useTasks } from "@/modules/task-management/tasks/queries";
import {
  TASK_STATUS_LABELS,
  canMoveToStatus,
  type Task,
  type TaskListParams,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";
import { type SwimlaneMode } from "@/modules/task-management/tasks/swimlanes";
import { useBoardShortcuts } from "@/modules/task-management/tasks/use-board-shortcuts";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

const LANE_PAGE_SIZE = 50;

function TaskBoardLane({
  status,
  sharedFilters,
  canCreate,
  pendingMove,
  onPendingMove,
  onOpenCreate,
  onOpenTask,
  onOpenParent,
  onAssignToMe,
  onDeleteTask,
  focusedTaskId,
  onFocusTask,
  menuTaskId,
  onMenuTaskId,
}: {
  status: TaskStatus;
  sharedFilters: Omit<TaskListParams, "status" | "page" | "page_size" | "sort_by" | "sort_order">;
  canCreate: boolean;
  pendingMove: PendingMove | null;
  onPendingMove: (move: PendingMove | null) => void;
  onOpenCreate: (status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onDeleteTask: (task: Task) => void;
  focusedTaskId: string | null;
  onFocusTask: (taskId: string | null) => void;
  menuTaskId: string | null;
  onMenuTaskId: (taskId: string | null) => void;
}) {
  const moveTask = useMoveTask();
  const createTask = useCreateTask();
  const [laneSize, setLaneSize] = useState(LANE_PAGE_SIZE);
  const [collapsed, setCollapsed] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [quickPending, setQuickPending] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const laneQuery = useTasks({
    ...sharedFilters,
    status,
    page: 1,
    page_size: laneSize,
    sort_by: "sort_order",
    sort_order: "asc",
  });

  const rows = useMemo(() => {
    const base = laneQuery.data?.data ?? [];
    if (!pendingMove || pendingMove.status !== status) {
      if (pendingMove) {
        return base.filter((task) => task.id !== pendingMove.taskId);
      }
      return base;
    }
    return applyPendingMove(base, pendingMove);
  }, [laneQuery.data?.data, pendingMove, status]);

  const total = laneQuery.data?.meta.total ?? rows.length;
  const hasMore = rows.length < total;

  async function commitDrop(task: Task, sortOrder: number) {
    onPendingMove({ taskId: task.id, status, index: sortOrder });
    try {
      await moveTask.mutateAsync({
        id: task.id,
        values: { status, sort_order: sortOrder },
      });
      toast.success("Task moved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      onPendingMove(null);
    }
  }

  async function createInColumn(title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    setQuickPending(true);
    try {
      const created = await createTask.mutateAsync({ title: trimmed });
      if (status !== "TODO") {
        await moveTask.mutateAsync({
          id: created.id,
          values: { status, sort_order: rows.length },
        });
      }
      setDraftTitle("");
      toast.success("Task created");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setQuickPending(false);
    }
  }

  if (collapsed) {
    return (
      <Card className="bg-muted/20 min-w-12 shrink-0">
        <CardHeader className="flex flex-col items-center gap-2 px-2 py-3">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Expand ${TASK_STATUS_LABELS[status]}`}
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight />
          </Button>
          <span
            className="text-muted-foreground [writing-mode:vertical-rl] rotate-180 text-xs font-medium"
            title={TASK_STATUS_LABELS[status]}
          >
            {TASK_STATUS_LABELS[status]} ({total})
          </span>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className="bg-muted/20 min-w-72 shrink-0"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain") || draggingId;
        if (!id) return;
        const task = rows.find((row) => row.id === id);
        const index = dropIndex ?? rows.length;
        if (task && !canMoveToStatus(task, status)) {
          toast.error("This move is not allowed");
          return;
        }
        if (task) {
          void commitDrop(task, index);
        } else {
          onPendingMove({ taskId: id, status, index });
          void moveTask
            .mutateAsync({ id, values: { status, sort_order: index } })
            .then(() => toast.success("Task moved"))
            .catch((error) => toast.error(getErrorMessage(error)))
            .finally(() => onPendingMove(null));
        }
        setDropIndex(null);
        setDraggingId(null);
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">
          {TASK_STATUS_LABELS[status]}
          <span className="text-muted-foreground ml-2 font-normal">({total})</span>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Collapse ${TASK_STATUS_LABELS[status]}`}
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft />
          </Button>
          {canCreate ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
              onClick={() => onOpenCreate(status)}
            >
              <Plus />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {laneQuery.isLoading ? <Loader2 className="text-muted-foreground mx-auto animate-spin" /> : null}
        {rows.map((row, index) => (
          <div key={row.id} className="relative">
            {dropIndex === index ? (
              <div className="bg-primary absolute inset-x-0 -top-1 h-0.5 rounded-full" />
            ) : null}
            <TaskCard
              task={row}
              focused={focusedTaskId === row.id}
              menuOpen={menuTaskId === row.id}
              onMenuOpenChange={(open) => onMenuTaskId(open ? row.id : null)}
              onOpen={() => onOpenTask(row.id)}
              onOpenParent={() => row.parent && onOpenParent(row.parent.id)}
              onAssignToMe={() => onAssignToMe(row.id)}
              onMove={(nextStatus) => {
                void moveTask.mutateAsync({
                  id: row.id,
                  values: { status: nextStatus, sort_order: 0 },
                });
              }}
              onDelete={() => onDeleteTask(row)}
              onDragStart={(event) => {
                setDraggingId(row.id);
                onFocusTask(row.id);
                event.dataTransfer.setData("text/plain", row.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDropIndex(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const elements = rows
                  .map((task) => cardRefs.current.get(task.id))
                  .filter((node): node is HTMLDivElement => Boolean(node));
                setDropIndex(computeDropIndex(event.clientY, elements));
              }}
              cardRef={(node) => {
                if (node) {
                  cardRefs.current.set(row.id, node);
                } else {
                  cardRefs.current.delete(row.id);
                }
              }}
            />
          </div>
        ))}
        {dropIndex === rows.length ? (
          <div className="bg-primary h-0.5 rounded-full" />
        ) : null}
        {hasMore ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={laneQuery.isFetching}
            onClick={() => setLaneSize((current) => current + LANE_PAGE_SIZE)}
          >
            Load more
          </Button>
        ) : null}
        {canCreate ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createInColumn(draftTitle);
            }}
          >
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder={`Add to ${TASK_STATUS_LABELS[status].toLowerCase()}…`}
              disabled={quickPending}
              aria-label={`Quick add task to ${TASK_STATUS_LABELS[status]}`}
            />
            <Button
              type="submit"
              size="icon-sm"
              variant="outline"
              disabled={quickPending || !draftTitle.trim()}
            >
              {quickPending ? <Loader2 className="animate-spin" /> : <Plus />}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TaskBoard({
  statuses,
  sharedFilters,
  swimlaneMode = null,
  canCreate = false,
  onOpenCreate,
  onOpenTask,
  onOpenParent,
  onAssignToMe,
  onDeleteTask,
  sheetOpen,
  onCloseSheet,
}: {
  statuses: TaskStatus[];
  sharedFilters: Omit<TaskListParams, "status" | "page" | "page_size" | "sort_by" | "sort_order">;
  swimlaneMode?: SwimlaneMode | null;
  canCreate?: boolean;
  onOpenCreate: (status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onDeleteTask: (task: Task) => void;
  sheetOpen: boolean;
  onCloseSheet: () => void;
}) {
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  useBoardShortcuts({
    enabled: true,
    statuses,
    focusedTaskId,
    onFocusTask: setFocusedTaskId,
    onOpenTask,
    onAssignToMe,
    onOpenMenu: setMenuTaskId,
    onClearFocus: () => setFocusedTaskId(null),
    sheetOpen,
    onCloseSheet,
  });

  if (swimlaneMode) {
    return (
      <TaskBoardSwimlanes
        swimlaneMode={swimlaneMode}
        statuses={statuses}
        sharedFilters={sharedFilters}
        canCreate={canCreate}
        onOpenTask={onOpenTask}
        onOpenParent={onOpenParent}
        onAssignToMe={onAssignToMe}
        onDeleteTask={onDeleteTask}
        focusedTaskId={focusedTaskId}
        onFocusTask={setFocusedTaskId}
        menuTaskId={menuTaskId}
        onMenuTaskId={setMenuTaskId}
        pendingMove={pendingMove}
        onPendingMove={setPendingMove}
      />
    );
  }

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2")}>
      {statuses.map((status) => (
        <TaskBoardLane
          key={status}
          status={status}
          sharedFilters={sharedFilters}
          canCreate={canCreate}
          pendingMove={pendingMove}
          onPendingMove={setPendingMove}
          onOpenCreate={onOpenCreate}
          onOpenTask={onOpenTask}
          onOpenParent={onOpenParent}
          onAssignToMe={onAssignToMe}
          onDeleteTask={onDeleteTask}
          focusedTaskId={focusedTaskId}
          onFocusTask={setFocusedTaskId}
          menuTaskId={menuTaskId}
          onMenuTaskId={setMenuTaskId}
        />
      ))}
    </div>
  );
}
