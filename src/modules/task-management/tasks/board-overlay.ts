import type { Task, TaskStatus } from "@/modules/task-management/tasks/schemas";

export type PendingMove = {
  taskId: string;
  status: TaskStatus;
  index: number;
  swimlaneKey?: string;
};

export function applyPendingMove(
  tasks: Task[],
  pending: PendingMove | null,
): Task[] {
  if (!pending) {
    return tasks;
  }
  const without = tasks.filter((task) => task.id !== pending.taskId);
  const moving = tasks.find((task) => task.id === pending.taskId);
  if (!moving) {
    return tasks;
  }
  const next = [...without];
  next.splice(pending.index, 0, { ...moving, status: pending.status });
  return next;
}

export function computeDropIndex(
  clientY: number,
  cardElements: HTMLElement[],
): number {
  for (let index = 0; index < cardElements.length; index += 1) {
    const rect = cardElements[index]?.getBoundingClientRect();
    if (!rect) continue;
    const midpoint = rect.top + rect.height / 2;
    if (clientY < midpoint) {
      return index;
    }
  }
  return cardElements.length;
}
