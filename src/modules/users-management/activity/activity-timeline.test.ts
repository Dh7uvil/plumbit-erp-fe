import { describe, expect, it } from "vitest";

import {
  activityActorLabel,
  activityDaySummary,
  activityVerb,
  filterHistoryRows,
  groupActivityByDay,
} from "@/modules/users-management/activity/activity-timeline";
import type { ActivityEntry } from "@/modules/users-management/activity/schemas";

function entry(overrides: Partial<ActivityEntry>): ActivityEntry {
  return {
    action: "UPDATE",
    actor_id: "22222222-2222-4222-8222-222222222222",
    actor_name: "Ada Lovelace",
    actor_email: "ada@plumbit.com",
    occurred_at: "2026-09-11T10:00:00.000Z",
    changed_fields: [],
    status: "SUCCESS",
    kind: "edit",
    summary: null,
    ...overrides,
  };
}

describe("filterHistoryRows", () => {
  const rows = [
    entry({ action: "CREATE", kind: "edit" }),
    entry({ action: "SUBMIT", kind: "approval" }),
    entry({
      action: "CREATE",
      kind: "attachment",
      summary: "packing-list.jpg",
    }),
  ];

  it("returns only approval events on the approvals tab", () => {
    expect(filterHistoryRows(rows, "approvals").map((row) => row.action)).toEqual(["SUBMIT"]);
  });

  it("filters edit history by kind", () => {
    expect(filterHistoryRows(rows, "edits", "all").map((row) => row.kind)).toEqual([
      "edit",
      "attachment",
    ]);
    expect(filterHistoryRows(rows, "edits", "edit").map((row) => row.kind)).toEqual(["edit"]);
    expect(filterHistoryRows(rows, "edits", "attachment").map((row) => row.kind)).toEqual([
      "attachment",
    ]);
  });
});

describe("groupActivityByDay", () => {
  it("groups consecutive events on the same local day", () => {
    const rows = [
      entry({ occurred_at: "2026-09-12T08:00:00.000Z", action: "UPDATE" }),
      entry({ occurred_at: "2026-09-11T16:00:00.000Z", action: "CREATE", kind: "attachment" }),
      entry({ occurred_at: "2026-09-11T10:00:00.000Z", action: "CREATE" }),
    ];
    const groups = groupActivityByDay(rows);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.rows).toHaveLength(1);
    expect(groups[1]?.rows).toHaveLength(2);
    expect(activityDaySummary(1)).toBe("1 Update");
    expect(activityDaySummary(2)).toBe("2 Updates");
  });
});

describe("activity copy", () => {
  it("prefers email for the actor label and maps attachment verbs", () => {
    const row = entry({
      kind: "attachment",
      action: "CREATE",
      summary: "file.jpg",
    });
    expect(activityActorLabel(row)).toBe("ada@plumbit.com");
    expect(activityVerb(row)).toBe("uploaded the file");
    expect(activityVerb(entry({ action: "APPROVE", kind: "approval" }))).toBe("approved");
  });
});
