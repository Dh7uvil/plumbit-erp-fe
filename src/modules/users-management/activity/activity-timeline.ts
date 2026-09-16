import type { ActivityEntry } from "@/modules/users-management/activity/schemas";
import { formatDate } from "@/shared/lib/format";

export type EditHistoryFilter = "all" | "edit" | "attachment";
export type ActivityHistoryTab = "approvals" | "edits";

export type ActivityDayGroup = {
  key: string;
  label: string;
  rows: ActivityEntry[];
};

export function filterHistoryRows(
  rows: ActivityEntry[],
  tab: ActivityHistoryTab,
  editFilter: EditHistoryFilter = "all",
): ActivityEntry[] {
  if (tab === "approvals") {
    return rows.filter((row) => row.kind === "approval");
  }
  const edits = rows.filter((row) => row.kind !== "approval");
  if (editFilter === "all") {
    return edits;
  }
  return edits.filter((row) => row.kind === editFilter);
}

export function groupActivityByDay(rows: ActivityEntry[]): ActivityDayGroup[] {
  const groups: ActivityDayGroup[] = [];
  for (const row of rows) {
    const key = dayKey(row.occurred_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.rows.push(row);
      continue;
    }
    groups.push({
      key,
      label: formatDate(row.occurred_at),
      rows: [row],
    });
  }
  return groups;
}

export function activityDaySummary(count: number): string {
  return count === 1 ? "1 Update" : `${count} Updates`;
}

export function activityActorLabel(row: ActivityEntry): string {
  return row.actor_email || row.actor_name || "System";
}

export function activityVerb(row: ActivityEntry): string {
  if (row.kind === "attachment") {
    if (row.action === "CREATE") {
      return "uploaded the file";
    }
    if (row.action === "DELETE") {
      return "deleted the file";
    }
    return "updated the file";
  }
  if (row.action === "CREATE") {
    return "created the record";
  }
  if (row.action === "UPDATE") {
    return "updated the record";
  }
  if (row.action === "DELETE") {
    return "deleted the record";
  }
  if (row.action === "SUBMIT") {
    return "submitted for approval";
  }
  if (row.action === "APPROVE") {
    return "approved";
  }
  if (row.action === "REJECT") {
    return "rejected";
  }
  return row.action.replaceAll("_", " ").toLowerCase();
}

function dayKey(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (match) {
    return match[1];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
