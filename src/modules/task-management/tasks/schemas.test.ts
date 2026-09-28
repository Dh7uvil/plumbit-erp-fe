import { describe, expect, it } from "vitest";

import { canMoveToStatus, type Task } from "@/modules/task-management/tasks/schemas";

const baseTask: Task = {
  id: "00000000-0000-4000-8000-000000000001",
  tenant_id: "00000000-0000-4000-8000-000000000002",
  task_number: "TASK-00001",
  task_type: "TASK",
  title: "Example",
  description: null,
  status: "TODO",
  priority: "MEDIUM",
  due_at: null,
  started_at: null,
  completed_at: null,
  assignee_id: null,
  parent_id: null,
  sort_order: 0,
  related_entity_type: null,
  related_entity_id: null,
  parent: null,
  subtask_count: 0,
  subtask_done_count: 0,
  labels: [],
  watcher_ids: [],
  checklist_items: [],
  available_actions: ["move:IN_PROGRESS", "move:DONE", "update"],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_by: null,
};

describe("canMoveToStatus", () => {
  it("returns true when move action is available", () => {
    expect(canMoveToStatus(baseTask, "IN_PROGRESS")).toBe(true);
  });

  it("returns true for any status when move action is available", () => {
    expect(canMoveToStatus(baseTask, "DONE")).toBe(true);
  });
});

describe("parseIdList", () => {
  it("round-trips comma-separated ids", async () => {
    const { parseIdList, serializeIdList } = await import("@/modules/task-management/tasks/schemas");
    const ids = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
    expect(parseIdList(serializeIdList(ids))).toEqual(ids);
  });
});
