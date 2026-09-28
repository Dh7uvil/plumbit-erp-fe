import { describe, expect, it } from "vitest";

import type { Task } from "@/modules/task-management/tasks/schemas";
import {
  deriveSwimlanes,
  epicKeyForTask,
  swimlaneDropUpdate,
  swimlaneKeyForTask,
  tasksInSwimlaneCell,
} from "@/modules/task-management/tasks/swimlanes";

function task(partial: Partial<Task> & Pick<Task, "id" | "status">): Task {
  return {
    tenant_id: "00000000-0000-0000-0000-000000000001",
    task_number: "TSK-1",
    task_type: "TASK",
    title: "Example",
    description: null,
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
    available_actions: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    ...partial,
  };
}

describe("swimlanes", () => {
  it("groups tasks by assignee swimlane key", () => {
    const alice = "11111111-1111-1111-1111-111111111111";
    const bob = "22222222-2222-2222-2222-222222222222";
    const rows = [
      task({ id: "a", status: "TODO", assignee_id: alice }),
      task({ id: "b", status: "DONE", assignee_id: bob }),
      task({ id: "c", status: "TODO", assignee_id: null }),
    ];
    const lanes = deriveSwimlanes(
      "assignee",
      rows,
      new Map([
        [alice, "Alice"],
        [bob, "Bob"],
      ]),
    );
    expect(lanes.map((lane) => lane.key)).toEqual(["unassigned", alice, bob]);
    expect(tasksInSwimlaneCell(rows, "assignee", alice, "TODO")).toHaveLength(1);
  });

  it("resolves epic swimlane keys from parent summaries", () => {
    const epicId = "33333333-3333-3333-3333-333333333333";
    const story = task({
      id: "story",
      status: "IN_PROGRESS",
      parent_id: epicId,
      parent: {
        id: epicId,
        task_number: "EPIC-1",
        title: "Launch",
        task_type: "EPIC",
      },
    });
    expect(epicKeyForTask(story)).toBe(epicId);
    expect(swimlaneKeyForTask(story, "epic")).toBe(epicId);
  });

  it("returns assign update when dropping across assignee rows", () => {
    const bob = "22222222-2222-2222-2222-222222222222";
    const moving = task({ id: "x", status: "TODO", assignee_id: null });
    expect(swimlaneDropUpdate(moving, "assignee", bob)).toEqual({
      kind: "assign",
      assignee_id: bob,
    });
  });

  it("skips epic parent updates for epic issues", () => {
    const epic = task({ id: "epic", status: "TODO", task_type: "EPIC" });
    expect(swimlaneDropUpdate(epic, "epic", "none")).toBeNull();
  });
});
