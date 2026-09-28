import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";

export const SWIMLANE_MODES = ["assignee", "priority", "epic"] as const;
export type SwimlaneMode = (typeof SWIMLANE_MODES)[number];

export const SWIMLANE_MODE_LABELS: Record<SwimlaneMode, string> = {
  assignee: "Assignee",
  priority: "Priority",
  epic: "Epic",
};

export type SwimlaneDef = {
  key: string;
  label: string;
};

export function parseSwimlaneMode(value: string | undefined): SwimlaneMode | null {
  if (!value) return null;
  return SWIMLANE_MODES.includes(value as SwimlaneMode) ? (value as SwimlaneMode) : null;
}

export function epicKeyForTask(task: Task): string {
  if (task.task_type === "EPIC") return task.id;
  if (task.parent?.task_type === "EPIC") return task.parent.id;
  return "none";
}

export function swimlaneKeyForTask(task: Task, mode: SwimlaneMode): string {
  switch (mode) {
    case "assignee":
      return task.assignee_id ?? "unassigned";
    case "priority":
      return task.priority;
    case "epic":
      return epicKeyForTask(task);
  }
}

export function deriveSwimlanes(
  mode: SwimlaneMode,
  tasks: Task[],
  userNameById: Map<string, string>,
): SwimlaneDef[] {
  const keys = new Set<string>();
  for (const task of tasks) {
    keys.add(swimlaneKeyForTask(task, mode));
  }

  if (mode === "assignee") {
    const ordered = [...keys].sort((left, right) => {
      if (left === "unassigned") return -1;
      if (right === "unassigned") return 1;
      const leftName = userNameById.get(left) ?? left;
      const rightName = userNameById.get(right) ?? right;
      return leftName.localeCompare(rightName);
    });
    return ordered.map((key) => ({
      key,
      label: key === "unassigned" ? "Unassigned" : (userNameById.get(key) ?? key),
    }));
  }

  if (mode === "priority") {
    return TASK_PRIORITIES.filter((priority) => keys.has(priority)).map((priority) => ({
      key: priority,
      label: TASK_PRIORITY_LABELS[priority],
    }));
  }

  const epicLabels = new Map<string, string>();
  for (const task of tasks) {
    const key = epicKeyForTask(task);
    if (key === "none") continue;
    if (task.task_type === "EPIC" && task.id === key) {
      epicLabels.set(key, `${task.task_number} · ${task.title}`);
    } else if (task.parent?.task_type === "EPIC" && task.parent.id === key) {
      epicLabels.set(
        key,
        `${task.parent.task_number} · ${task.parent.title}`,
      );
    }
  }

  const ordered = [...keys].sort((left, right) => {
    if (left === "none") return -1;
    if (right === "none") return 1;
    return (epicLabels.get(left) ?? left).localeCompare(epicLabels.get(right) ?? right);
  });

  return ordered.map((key) => ({
    key,
    label: key === "none" ? "No epic" : (epicLabels.get(key) ?? key),
  }));
}

export function tasksInSwimlaneCell(
  tasks: Task[],
  mode: SwimlaneMode,
  swimlaneKey: string,
  status: TaskStatus,
): Task[] {
  return tasks
    .filter(
      (task) =>
        task.status === status && swimlaneKeyForTask(task, mode) === swimlaneKey,
    )
    .sort((left, right) => left.sort_order - right.sort_order);
}

export type SwimlaneDropUpdate =
  | { kind: "assign"; assignee_id: string | null }
  | { kind: "update"; values: { priority?: TaskPriority; parent_id?: string | null } }
  | null;

export function swimlaneDropUpdate(
  task: Task,
  mode: SwimlaneMode,
  targetSwimlaneKey: string,
): SwimlaneDropUpdate {
  if (swimlaneKeyForTask(task, mode) === targetSwimlaneKey) {
    return null;
  }

  if (mode === "assignee") {
    return {
      kind: "assign",
      assignee_id: targetSwimlaneKey === "unassigned" ? null : targetSwimlaneKey,
    };
  }

  if (mode === "priority") {
    return {
      kind: "update",
      values: { priority: targetSwimlaneKey as TaskPriority },
    };
  }

  if (task.task_type === "EPIC") {
    return null;
  }

  return {
    kind: "update",
    values: {
      parent_id: targetSwimlaneKey === "none" ? null : targetSwimlaneKey,
    },
  };
}

export function swimlaneCreateDefaults(
  mode: SwimlaneMode,
  swimlaneKey: string,
): {
  createAssigneeId?: string | null;
  createPriority?: TaskPriority;
  createParentId?: string | null;
} {
  switch (mode) {
    case "assignee":
      return {
        createAssigneeId: swimlaneKey === "unassigned" ? null : swimlaneKey,
      };
    case "priority":
      return {
        createPriority: swimlaneKey as TaskPriority,
      };
    case "epic":
      return {
        createParentId: swimlaneKey === "none" ? null : swimlaneKey,
      };
  }
}
