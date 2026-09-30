"use client";

import { ShieldCheck, ShieldX } from "lucide-react";
import { useState } from "react";

import { useGlIntegrity } from "@/modules/erp/accounting/integrity/queries";
import type { GlIntegrityIssue } from "@/modules/erp/accounting/integrity/schemas";
import { todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatReportMoney, humanizeEnum } from "@/shared/lib/format";

function issueLabel(issue: GlIntegrityIssue): string {
  return humanizeEnum(issue.kind);
}

function issueDetail(issue: GlIntegrityIssue): string {
  if (issue.kind === "control_vs_subledger") {
    const parts = [
      issue.party_name ?? issue.party_id,
      issue.gl_balance != null ? `GL ${formatReportMoney(issue.gl_balance)}` : null,
      issue.subledger_balance != null
        ? `Sub-ledger ${formatReportMoney(issue.subledger_balance)}`
        : null,
      issue.variance != null ? `Variance ${formatReportMoney(issue.variance)}` : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }
  if (issue.document_number) {
    return issue.document_number;
  }
  return issue.message;
}

export function GlIntegrityScreen() {
  const [asOf, setAsOf] = useState(todayIsoDate());
  const scanQuery = useGlIntegrity(asOf);
  const scan = scanQuery.data;

  return (
    <ReportShell
      title="GL integrity"
      subtitle="Automated checks for balanced journals, trial balance, and AR/AP control vs sub-ledger"
      toolbar={
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">As of</span>
            <Input
              type="date"
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
              className="w-[11rem]"
            />
          </label>
        </div>
      }
    >
      {scanQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : scanQuery.isError ? (
        <DataTableError message={getErrorMessage(scanQuery.error)} />
      ) : !scan ? (
        <DataTableEmpty message="Run a scan to view integrity results." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {scan.ok ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="size-3.5" />
                All checks passed
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <ShieldX className="size-3.5" />
                {scan.issue_count} issue{scan.issue_count === 1 ? "" : "s"}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">As of {formatDate(scan.as_of)}</span>
          </div>

          {scan.issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No integrity issues were found for journals, trial balance, or control accounts.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scan.issues.map((issue, index) => (
                  <TableRow key={`${issue.kind}-${issue.journal_id ?? issue.party_id ?? index}`}>
                    <TableCell className="font-medium">{issueLabel(issue)}</TableCell>
                    <TableCell className="text-muted-foreground">{issueDetail(issue)}</TableCell>
                    <TableCell>{issue.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </ReportShell>
  );
}
