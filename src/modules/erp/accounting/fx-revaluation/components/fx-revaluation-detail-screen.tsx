"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useReverseFxRevaluation } from "@/modules/erp/accounting/fx-revaluation/mutations";
import { fxRevaluationPermissions } from "@/modules/erp/accounting/fx-revaluation/permissions";
import { useFxRevaluation } from "@/modules/erp/accounting/fx-revaluation/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatReportMoney, humanizeEnum } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function dayAfter(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function FxRevaluationDetailScreen({ runId }: { runId: string }) {
  const can = useCan();
  const runQuery = useFxRevaluation(runId);
  const reverse = useReverseFxRevaluation();
  const run = runQuery.data;
  const [reversalDate, setReversalDate] = useState("");
  const [confirmReverse, setConfirmReverse] = useState(false);
  const money = (value: string | null | undefined) => formatReportMoney(value, "");

  async function onReverse() {
    if (!run) {
      return;
    }
    try {
      await reverse.mutateAsync({
        id: run.id,
        version: run.version,
        reversalDate: reversalDate || dayAfter(run.as_of_date),
      });
      toast.success("Revaluation reversed");
      setConfirmReverse(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (runQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (runQuery.isError || !run) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={getErrorMessage(runQuery.error)}
          onRetry={() => runQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/fx-revaluation">Back to FX revaluation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={`FX revaluation ${formatDate(run.as_of_date)}`}
        listHref="/fx-revaluation"
        viewHref={`/fx-revaluation/${run.id}`}
        canUpdate={false}
        mode="view"
        badges={
          <DocumentStatusBadge
            status={run.status as "POSTED" | "REVERSED"}
            labels={{ POSTED: "Posted", REVERSED: "Reversed" }}
            variants={{ POSTED: "success", REVERSED: "muted" }}
          />
        }
        extraActions={
          run.available_actions.includes("reverse") && can(fxRevaluationPermissions.reverse) ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={reversalDate || dayAfter(run.as_of_date)}
                onChange={(event) => setReversalDate(event.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => setConfirmReverse(true)}>
                Reverse
              </Button>
            </div>
          ) : undefined
        }
      />
      <p className="text-muted-foreground text-sm">
        Total gain {money(run.total_gain_base)}
        {run.journal_entry_id ? (
          <>
            {" "}
            · <RecordLink href={`/journals/${run.journal_entry_id}`}>Open journal</RecordLink>
          </>
        ) : null}
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exposure lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Foreign</TableHead>
                <TableHead className="text-right">Book base</TableHead>
                <TableHead className="text-right">Revalued base</TableHead>
                <TableHead className="text-right">Gain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{humanizeEnum(line.exposure_kind)}</TableCell>
                  <TableCell>{line.currency_code ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.foreign_balance}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.book_base ? money(line.book_base) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.revalued_base ? money(line.revalued_base) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(line.gain_base)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={confirmReverse}
        title="Reverse FX revaluation"
        description={`Reverse the revaluation as of ${formatDate(reversalDate || dayAfter(run.as_of_date))}?`}
        confirmLabel="Reverse"
        pending={reverse.isPending}
        onOpenChange={setConfirmReverse}
        onConfirm={() => void onReverse()}
      />
    </div>
  );
}
