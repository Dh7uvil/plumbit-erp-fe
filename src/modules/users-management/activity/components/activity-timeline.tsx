"use client";

import {
  formatAuditValue,
  humanizeAuditField,
} from "@/modules/users-management/audit-logs/audit-log-format";
import {
  activityActorLabel,
  activityDaySummary,
  activityVerb,
  groupActivityByDay,
} from "@/modules/users-management/activity/activity-timeline";
import type {
  ActivityChangedField,
  ActivityEntry,
} from "@/modules/users-management/activity/schemas";
import { DataTableEmpty } from "@/shared/components/data-table/states";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { formatDateTime, initials } from "@/shared/lib/format";

function formatChangedValue(value: unknown): string {
  const formatted = formatAuditValue(value);
  if (formatted.kind === "empty") {
    return "—";
  }
  if (formatted.kind === "list") {
    return formatted.items.join(", ");
  }
  return formatted.text;
}

const DETAIL_CARD_CLASS = "bg-card border-border mt-2 rounded-md border px-3 py-2 shadow-sm";

function actorInitials(row: ActivityEntry): string {
  const source = row.actor_name || row.actor_email || "S";
  return initials(source) || source.slice(0, 1).toUpperCase();
}

function AttachmentDetail({ filename }: { filename: string }) {
  return (
    <div className={DETAIL_CARD_CLASS}>
      <p className="text-muted-foreground text-xs">File name</p>
      <p className="font-mono text-sm break-all">{filename}</p>
    </div>
  );
}

function FieldChanges({ changes }: { changes: ActivityChangedField[] }) {
  if (changes.length === 0) {
    return null;
  }
  return (
    <div className={DETAIL_CARD_CLASS}>
      <ul className="flex flex-col gap-1">
        {changes.map((change) => (
          <li key={change.field} className="text-xs">
            <span className="font-medium">{humanizeAuditField(change.field)}</span>
            <span className="text-muted-foreground">
              {`: ${formatChangedValue(change.old_value)} → ${formatChangedValue(change.new_value)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReasonDetail({ reason }: { reason: string }) {
  return (
    <div className={DETAIL_CARD_CLASS}>
      <p className="text-muted-foreground text-xs">Reason</p>
      <p className="text-sm">{reason}</p>
    </div>
  );
}

export function ActivityTimeline({
  rows,
  emptyTitle,
  emptyMessage,
}: {
  rows: ActivityEntry[];
  emptyTitle: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <DataTableEmpty title={emptyTitle} message={emptyMessage} />;
  }

  const groups = groupActivityByDay(rows);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="bg-foreground size-2 shrink-0 rounded-full" aria-hidden />
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <p className="text-muted-foreground text-xs">{activityDaySummary(group.rows.length)}</p>
          </div>
          <ol className="border-border ml-1 flex flex-col gap-5 border-l pl-5">
            {group.rows.map((row, index) => (
              <li key={`${row.occurred_at}-${row.action}-${index}`} className="flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback>{actorInitials(row)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-medium">{activityActorLabel(row)}</span>{" "}
                      <span className="text-muted-foreground">{activityVerb(row)}</span>
                    </p>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {formatDateTime(row.occurred_at)}
                    </p>
                  </div>
                  {row.kind === "attachment" && row.summary ? (
                    <AttachmentDetail filename={row.summary} />
                  ) : null}
                  {row.kind === "approval" && row.summary ? (
                    <ReasonDetail reason={row.summary} />
                  ) : null}
                  {row.kind !== "attachment" ? <FieldChanges changes={row.changed_fields} /> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
