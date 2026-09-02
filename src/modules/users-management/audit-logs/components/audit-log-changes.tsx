"use client";

import {
  formatAuditValue,
  humanizeAuditField,
} from "@/modules/users-management/audit-logs/audit-log-format";
import type { AuditLogChange } from "@/modules/users-management/audit-logs/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

function AuditValue({ value, className }: { value: unknown; className?: string }) {
  const formatted = formatAuditValue(value);

  if (formatted.kind === "empty") {
    return <span className={cn("text-sm", className)}>—</span>;
  }

  if (formatted.kind === "list") {
    return (
      <ul className={cn("flex flex-col gap-0.5 text-sm break-all", className)}>
        {formatted.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  if (formatted.kind === "json") {
    return (
      <pre className={cn("font-mono text-xs break-all whitespace-pre-wrap", className)}>
        {formatted.text}
      </pre>
    );
  }

  return <span className={cn("text-sm break-all", className)}>{formatted.text}</span>;
}

export function AuditLogChanges({ changes }: { changes: AuditLogChange[] }) {
  if (changes.length === 0) {
    return <p className="text-muted-foreground text-sm">No field changes recorded</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Before</TableHead>
          <TableHead>After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((change) => {
          const afterChanged = change.new_value !== null && change.new_value !== undefined;
          return (
            <TableRow key={change.field}>
              <TableCell className="align-top text-sm whitespace-normal" title={change.field}>
                {humanizeAuditField(change.field)}
              </TableCell>
              <TableCell className="text-muted-foreground align-top whitespace-normal">
                <AuditValue value={change.old_value} />
              </TableCell>
              <TableCell
                className={cn(
                  "align-top whitespace-normal",
                  afterChanged && "bg-emerald-50 dark:bg-emerald-950/40",
                )}
              >
                <AuditValue
                  value={change.new_value}
                  className={afterChanged ? "text-emerald-800 dark:text-emerald-300" : undefined}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
