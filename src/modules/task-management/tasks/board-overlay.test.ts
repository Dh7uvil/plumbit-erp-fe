import { describe, expect, it } from "vitest";

import { applyPendingMove, computeDropIndex } from "@/modules/task-management/tasks/board-overlay";
import type { Task } from "@/modules/task-management/tasks/schemas";

const task = (id: string, status: Task["status"], sortOrder: number): Task => ({
  id,
  tenant_id: "00000000-0000-4000-8000-000000000002",
  task_number: `TASK-${id}`,
  task_type: "TASK",
  title: id,
  description: null,
  status,
  priority: "MEDIUM",
  due_at: null,
  started_at: null,
  completed_at: null,
  assignee_id: null,
  parent_id: null,
  sort_order: sortOrder,
  related_entity_type: null,
  related_entity_id: null,
  parent: null,
  subtask_count: 0,
  subtask_done_count: 0,
  labels: [],
  watcher_ids: [],
  checklist_items: [],
  available_actions: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_by: null,
});

describe("applyPendingMove", () => {
  it("moves a task into the target lane at the requested index", () => {
    const rows = [task("a", "TODO", 0), task("b", "TODO", 1)];
    const result = applyPendingMove(rows, {
      taskId: "a",
      status: "IN_PROGRESS",
      index: 0,
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("a");
    expect(result[1]?.id).toBe("b");
  });
});

describe("computeDropIndex", () => {
  it("returns length when pointer is below all cards", () => {
    const elements = [
      { getBoundingClientRect: () => ({ top: 0, height: 40 }) },
    ] as HTMLElement[];
    expect(computeDropIndex(100, elements)).toBe(1);
  });
});
