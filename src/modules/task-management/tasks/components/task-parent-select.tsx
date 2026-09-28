"use client";

import { useMemo } from "react";

import { useTasks } from "@/modules/task-management/tasks/queries";
import {
  MAX_TASK_DEPTH,
  TASK_TYPE_LABELS,
  type Task,
  type TaskType,
} from "@/modules/task-management/tasks/schemas";
import { SearchableSelect } from "@/shared/components/form/searchable-select";

const NONE = "__none__";

function parentDepth(task: Task, byId: Map<string, Task>): number {
  let depth = 1;
  let current = task.parent_id ? byId.get(task.parent_id) : undefined;
  while (current) {
    depth += 1;
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return depth;
}

export function TaskParentSelect({
  value,
  onValueChange,
  excludeTaskId,
  taskType,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  excludeTaskId?: string;
  taskType: TaskType;
  disabled?: boolean;
}) {
  const tasksQuery = useTasks({ page: 1, page_size: 200, sort_by: "title", sort_order: "asc" });
  const rows = tasksQuery.data?.data ?? [];

  const byId = useMemo(() => new Map(rows.map((task) => [task.id, task])), [rows]);

  const options = useMemo(() => {
    const base = [{ value: NONE, label: "No parent" }];
    if (taskType === "EPIC") {
      return base;
    }
    const candidates = rows.filter((task) => {
      if (excludeTaskId && task.id === excludeTaskId) {
        return false;
      }
      if (taskType === "STORY" && task.task_type !== "EPIC") {
        return false;
      }
      if (taskType === "TASK" && !["EPIC", "STORY"].includes(task.task_type)) {
        return false;
      }
      if (taskType === "BUG" && !["EPIC", "STORY"].includes(task.task_type)) {
        return false;
      }
      return parentDepth(task, byId) < MAX_TASK_DEPTH - 1;
    });
    return [
      ...base,
      ...candidates.map((task) => ({
        value: task.id,
        label: `${task.task_number} · ${task.title} (${TASK_TYPE_LABELS[task.task_type]})`,
      })),
    ];
  }, [byId, excludeTaskId, rows, taskType]);

  return (
    <SearchableSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      disabled={disabled || tasksQuery.isLoading}
      placeholder="Select parent task"
      searchPlaceholder="Search tasks…"
    />
  );
}
