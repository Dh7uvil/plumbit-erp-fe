"use client";

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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
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
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (runQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (runQuery.isError || !run) {
    return (
      <DataTableError
        message={getErrorMessage(runQuery.error)}
        onRetry={() => runQuery.refetch()}
      />
    );
  }

  return (
    <ListPage>
      <PageHeader
        title={`FX revaluation ${run.as_of_date}`}
        subtitle={`${run.status} · gain ${run.total_gain_base}`}
        actions={
          run.available_actions.includes("reverse") && can(fxRevaluationPermissions.reverse) ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={reversalDate || dayAfter(run.as_of_date)}
                onChange={(event) => setReversalDate(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={reverse.isPending}
                onClick={() => void onReverse()}
              >
                {reverse.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Reverse
              </Button>
            </div>
          ) : undefined
        }
      />
      {run.journal_entry_id ? (
        <RecordLink href={`/journals/${run.journal_entry_id}`}>Open journal</RecordLink>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Kind</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Foreign</TableHead>
            <TableHead>Gain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {run.lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.exposure_kind}</TableCell>
              <TableCell>{line.currency_code ?? "—"}</TableCell>
              <TableCell>{line.foreign_balance}</TableCell>
              <TableCell>{line.gain_base}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
