"use client";

import { Loader2, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  applyPendingMove,
  computeDropIndex,
  type PendingMove,
} from "@/modules/task-management/tasks/board-overlay";
import { TaskCard } from "@/modules/task-management/tasks/components/task-card";
import {
  useAssignTask,
  useCreateTask,
  useMoveTask,
  useUpdateTask,
} from "@/modules/task-management/tasks/mutations";
import { useTasks } from "@/modules/task-management/tasks/queries";
import {
  TASK_STATUS_LABELS,
  canMoveToStatus,
  type Task,
  type TaskListParams,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";
import {
  deriveSwimlanes,
  swimlaneCreateDefaults,
  swimlaneDropUpdate,
  swimlaneKeyForTask,
  tasksInSwimlaneCell,
  type SwimlaneDef,
  type SwimlaneMode,
} from "@/modules/task-management/tasks/swimlanes";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

const SWIMLANE_PAGE_SIZE = 200;

function TaskBoardSwimlaneCell({
  status,
  swimlaneKey,
  swimlaneMode,
  tasks,
  allTasks,
  canCreate,
  pendingMove,
  onPendingMove,
  onOpenTask,
  onOpenParent,
  onAssignToMe,
  onDeleteTask,
  onCommitDrop,
  focusedTaskId,
  onFocusTask,
  menuTaskId,
  onMenuTaskId,
}: {
  status: TaskStatus;
  swimlaneKey: string;
  swimlaneMode: SwimlaneMode;
  tasks: Task[];
  allTasks: Task[];
  canCreate: boolean;
  pendingMove: PendingMove | null;
  onPendingMove: (move: PendingMove | null) => void;
  onOpenTask: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onDeleteTask: (task: Task) => void;
  onCommitDrop: (task: Task, status: TaskStatus, index: number, swimlaneKey: string) => Promise<void>;
  focusedTaskId: string | null;
  onFocusTask: (taskId: string | null) => void;
  menuTaskId: string | null;
  onMenuTaskId: (taskId: string | null) => void;
}) {
  const moveTask = useMoveTask();
  const createTask = useCreateTask();
  const [draftTitle, setDraftTitle] = useState("");
  const [quickPending, setQuickPending] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const rows = useMemo(() => {
    if (
      !pendingMove ||
      pendingMove.status !== status ||
      pendingMove.swimlaneKey !== swimlaneKey
    ) {
      if (pendingMove) {
        return tasks.filter((task) => task.id !== pendingMove.taskId);
      }
      return tasks;
    }
    return applyPendingMove(tasks, pendingMove);
  }, [pendingMove, status, swimlaneKey, tasks]);

  async function createInCell(title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    setQuickPending(true);
    try {
      const defaults = swimlaneCreateDefaults(swimlaneMode, swimlaneKey);
      const created = await createTask.mutateAsync({
        title: trimmed,
        assignee_id: defaults.createAssigneeId,
        priority: defaults.createPriority,
        parent_id: defaults.createParentId,
      });
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

  return (
    <Card
      className="bg-muted/20 min-h-24 min-w-72 shrink-0"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain") || draggingId;
        if (!id) return;
        const task = rows.find((row) => row.id === id) ?? allTasks.find((row) => row.id === id);
        const index = dropIndex ?? rows.length;
        if (task && !canMoveToStatus(task, status)) {
          toast.error("This move is not allowed");
          return;
        }
        if (task) {
          void onCommitDrop(task, status, index, swimlaneKey);
        }
        setDropIndex(null);
        setDraggingId(null);
      }}
    >
      <CardContent className="flex flex-col gap-2 p-2">
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
        {canCreate ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createInCell(draftTitle);
            }}
          >
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder={`Add to ${TASK_STATUS_LABELS[status].toLowerCase()}…`}
              disabled={quickPending}
              aria-label={`Quick add task to ${TASK_STATUS_LABELS[status]} swimlane cell`}
            />
            <Button
              type="submit"
              size="icon-sm"
              variant="outline"
              disabled={quickPending || !draftTitle.trim()}
              aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
            >
              {quickPending ? <Loader2 className="animate-spin" /> : <Plus />}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskBoardSwimlaneRow({
  swimlane,
  swimlaneMode,
  statuses,
  allTasks,
  canCreate,
  pendingMove,
  onPendingMove,
  onOpenTask,
  onOpenParent,
  onAssignToMe,
  onDeleteTask,
  onCommitDrop,
  focusedTaskId,
  onFocusTask,
  menuTaskId,
  onMenuTaskId,
}: {
  swimlane: SwimlaneDef;
  swimlaneMode: SwimlaneMode;
  statuses: TaskStatus[];
  allTasks: Task[];
  canCreate: boolean;
  pendingMove: PendingMove | null;
  onPendingMove: (move: PendingMove | null) => void;
  onOpenTask: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onDeleteTask: (task: Task) => void;
  onCommitDrop: (task: Task, status: TaskStatus, index: number, swimlaneKey: string) => Promise<void>;
  focusedTaskId: string | null;
  onFocusTask: (taskId: string | null) => void;
  menuTaskId: string | null;
  onMenuTaskId: (taskId: string | null) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-background sticky left-0 z-10 flex min-w-40 max-w-40 shrink-0 items-start border-r px-3 py-4">
        <span className="line-clamp-3 text-sm font-medium" title={swimlane.label}>
          {swimlane.label}
        </span>
      </div>
      {statuses.map((status) => (
        <TaskBoardSwimlaneCell
          key={`${swimlane.key}-${status}`}
          status={status}
          swimlaneKey={swimlane.key}
          swimlaneMode={swimlaneMode}
          tasks={tasksInSwimlaneCell(allTasks, swimlaneMode, swimlane.key, status)}
          allTasks={allTasks}
          canCreate={canCreate}
          pendingMove={pendingMove}
          onPendingMove={onPendingMove}
          onOpenTask={onOpenTask}
          onOpenParent={onOpenParent}
          onAssignToMe={onAssignToMe}
          onDeleteTask={onDeleteTask}
          onCommitDrop={onCommitDrop}
          focusedTaskId={focusedTaskId}
          onFocusTask={onFocusTask}
          menuTaskId={menuTaskId}
          onMenuTaskId={onMenuTaskId}
        />
      ))}
    </div>
  );
}

export function TaskBoardSwimlanes({
  swimlaneMode,
  statuses,
  sharedFilters,
  canCreate = false,
  onOpenTask,
  onOpenParent,
  onAssignToMe,
  onDeleteTask,
  focusedTaskId,
  onFocusTask,
  menuTaskId,
  onMenuTaskId,
  pendingMove,
  onPendingMove,
}: {
  swimlaneMode: SwimlaneMode;
  statuses: TaskStatus[];
  sharedFilters: Omit<TaskListParams, "status" | "page" | "page_size" | "sort_by" | "sort_order">;
  canCreate?: boolean;
  onOpenTask: (taskId: string) => void;
  onOpenParent: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onDeleteTask: (task: Task) => void;
  focusedTaskId: string | null;
  onFocusTask: (taskId: string | null) => void;
  menuTaskId: string | null;
  onMenuTaskId: (taskId: string | null) => void;
  pendingMove: PendingMove | null;
  onPendingMove: (move: PendingMove | null) => void;
}) {
  const moveTask = useMoveTask();
  const assignTask = useAssignTask();
  const updateTask = useUpdateTask();
  const usersQuery = useAllUsers();
  const [pageSize, setPageSize] = useState(SWIMLANE_PAGE_SIZE);

  const boardQuery = useTasks({
    ...sharedFilters,
    page: 1,
    page_size: pageSize,
    sort_by: "sort_order",
    sort_order: "asc",
  });

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data ?? []) {
      map.set(user.id, user.name || user.email);
    }
    return map;
  }, [usersQuery.data]);

  const allTasks = boardQuery.data?.data ?? [];
  const swimlanes = useMemo(
    () => deriveSwimlanes(swimlaneMode, allTasks, userNameById),
    [allTasks, swimlaneMode, userNameById],
  );

  const total = boardQuery.data?.meta.total ?? allTasks.length;
  const hasMore = allTasks.length < total;

  async function commitDrop(
    task: Task,
    status: TaskStatus,
    index: number,
    targetSwimlaneKey: string,
  ) {
    const laneUpdate = swimlaneDropUpdate(task, swimlaneMode, targetSwimlaneKey);
    if (laneUpdate === null && swimlaneKeyForTask(task, swimlaneMode) !== targetSwimlaneKey) {
      toast.error("This task cannot move to that swimlane");
      return;
    }

    onPendingMove({ taskId: task.id, status, index, swimlaneKey: targetSwimlaneKey });
    try {
      await moveTask.mutateAsync({
        id: task.id,
        values: { status, sort_order: index },
      });
      if (laneUpdate?.kind === "assign") {
        await assignTask.mutateAsync({
          id: task.id,
          values: { assignee_id: laneUpdate.assignee_id },
        });
      } else if (laneUpdate?.kind === "update") {
        await updateTask.mutateAsync({
          id: task.id,
          values: laneUpdate.values,
        });
      }
      toast.success("Task moved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      onPendingMove(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="bg-background sticky left-0 z-10 min-w-40 max-w-40 shrink-0 border-r px-3 py-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Swimlane
          </span>
        </div>
        {statuses.map((status) => (
          <div key={status} className="min-w-72 shrink-0 px-2 py-2">
            <span className="text-sm font-medium">
              {TASK_STATUS_LABELS[status]}
              <span className="text-muted-foreground ml-2 font-normal">
                ({allTasks.filter((task) => task.status === status).length})
              </span>
            </span>
          </div>
        ))}
      </div>
      {boardQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground animate-spin" />
        </div>
      ) : null}
      {!boardQuery.isLoading && swimlanes.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No tasks match the current filters.</p>
      ) : null}
      <div className={cn("space-y-3 overflow-x-auto pb-2")}>
        {swimlanes.map((swimlane) => (
          <TaskBoardSwimlaneRow
            key={swimlane.key}
            swimlane={swimlane}
            swimlaneMode={swimlaneMode}
            statuses={statuses}
            allTasks={allTasks}
            canCreate={canCreate}
            pendingMove={pendingMove}
            onPendingMove={onPendingMove}
            onOpenTask={onOpenTask}
            onOpenParent={onOpenParent}
            onAssignToMe={onAssignToMe}
            onDeleteTask={onDeleteTask}
            onCommitDrop={commitDrop}
            focusedTaskId={focusedTaskId}
            onFocusTask={onFocusTask}
            menuTaskId={menuTaskId}
            onMenuTaskId={onMenuTaskId}
          />
        ))}
      </div>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={boardQuery.isFetching}
          onClick={() => setPageSize((current) => current + SWIMLANE_PAGE_SIZE)}
        >
          Load more tasks
        </Button>
      ) : null}
    </div>
  );
}
