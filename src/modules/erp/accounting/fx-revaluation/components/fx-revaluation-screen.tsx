"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useRunFxRevaluation } from "@/modules/erp/accounting/fx-revaluation/mutations";
import { fxRevaluationPermissions } from "@/modules/erp/accounting/fx-revaluation/permissions";
import { useFxExposure, useFxRevaluations } from "@/modules/erp/accounting/fx-revaluation/queries";
import type { FxRevaluationRun } from "@/modules/erp/accounting/fx-revaluation/schemas";
import { todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate, formatReportMoney, humanizeEnum } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function FxRevaluationScreen() {
  const can = useCan();
  const [asOf, setAsOf] = useState(todayIsoDate());
  const [confirmPost, setConfirmPost] = useState(false);
  const exposureQuery = useFxExposure(asOf);
  const runsQuery = useFxRevaluations();
  const run = useRunFxRevaluation();
  const exposure = exposureQuery.data;
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, exposure?.currency_code);

  const runColumnDefs = useMemo((): Array<DataTableColumn<FxRevaluationRun>> => {
    return [
      {
        id: "as_of_date",
        header: "As of",
        cell: (row) => (
          <RecordLink href={`/fx-revaluation/${row.id}`}>{formatDate(row.as_of_date)}</RecordLink>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status as "POSTED" | "REVERSED"}
            labels={{ POSTED: "Posted", REVERSED: "Reversed" }}
            variants={{ POSTED: "success", REVERSED: "muted" }}
          />
        ),
      },
      {
        id: "total_gain_base",
        header: "Gain",
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (row) => formatReportMoney(row.total_gain_base, exposure?.currency_code),
      },
    ];
  }, [exposure?.currency_code]);

  const { columns: runColumns, colSpan: runColSpan } = useTableColumns(
    "erp.fx_revaluation.runs",
    runColumnDefs,
  );

  async function onRun() {
    try {
      const created = await run.mutateAsync(asOf);
      toast.success(`Posted unrealized FX of ${created.total_gain_base}`);
      setConfirmPost(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="FX revaluation"
        subtitle="Revalue open foreign balances in the ledger. Invoices and bills keep their original rate."
        actions={
          can(fxRevaluationPermissions.run) ? (
            <Button
              type="button"
              disabled={run.isPending || !asOf}
              onClick={() => setConfirmPost(true)}
            >
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Post revaluation
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <label className="flex w-48 flex-col gap-1 text-sm">
          As of
          <Input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
        </label>
      </DataTableToolbar>
      {exposure?.warnings.map((warning) => (
        <p key={warning} className="text-muted-foreground text-sm">
          {warning}
        </p>
      ))}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Kind</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Foreign</TableHead>
            <TableHead className="text-right">Book</TableHead>
            <TableHead className="text-right">Revalued</TableHead>
            <TableHead className="text-right">Gain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exposureQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : exposureQuery.isError ? (
            <TableRow>
              <TableCell colSpan={6}>
                <DataTableError
                  message={getErrorMessage(exposureQuery.error)}
                  onRetry={() => exposureQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : (exposure?.lines.length ?? 0) === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <DataTableEmpty
                  title="No unrealized difference"
                  message="Open foreign balances already match the closing rate."
                />
              </TableCell>
            </TableRow>
          ) : (
            exposure?.lines.map((line) => (
              <TableRow key={`${line.exposure_kind}-${line.account_id}-${line.currency_id}`}>
                <TableCell>{humanizeEnum(line.exposure_kind)}</TableCell>
                <TableCell>{line.currency_code ?? line.currency_id}</TableCell>
                <TableCell className="text-right tabular-nums">{line.foreign_balance}</TableCell>
                <TableCell className="text-right tabular-nums">{money(line.book_base)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(line.revalued_base)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <RecordLink href={glHref(line.account_id, asOf, asOf)}>
                    {money(line.gain_base)}
                  </RecordLink>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      {exposure ? (
        <p className="text-sm font-medium">
          Total unrealized gain {money(exposure.total_gain_base)}
        </p>
      ) : null}
      <h2 className="text-lg font-semibold">Runs</h2>
      <DataTable>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={runColumns} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {runsQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={runColSpan}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : runsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={runColSpan}>
                <DataTableError
                  message={getErrorMessage(runsQuery.error)}
                  onRetry={() => runsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : (runsQuery.data?.data.length ?? 0) === 0 ? (
            <TableRow>
              <TableCell colSpan={runColSpan}>
                <DataTableEmpty title="No runs" message="Posted revaluations appear here." />
              </TableCell>
            </TableRow>
          ) : (
            runsQuery.data?.data.map((row) => (
              <TableRow key={row.id}>
                <DataTableCells columns={runColumns} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={confirmPost}
        title="Post FX revaluation"
        description={`Post unrealized FX revaluation as of ${formatDate(asOf)}?`}
        confirmLabel="Post revaluation"
        pending={run.isPending}
        onOpenChange={setConfirmPost}
        onConfirm={() => void onRun()}
      />
    </ListPage>
  );
}
