"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useRunFxRevaluation } from "@/modules/erp/accounting/fx-revaluation/mutations";
import { fxRevaluationPermissions } from "@/modules/erp/accounting/fx-revaluation/permissions";
import { useFxExposure, useFxRevaluations } from "@/modules/erp/accounting/fx-revaluation/queries";
import { todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
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
import { formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function FxRevaluationScreen() {
  const can = useCan();
  const [asOf, setAsOf] = useState(todayIsoDate());
  const exposureQuery = useFxExposure(asOf);
  const runsQuery = useFxRevaluations();
  const run = useRunFxRevaluation();
  const exposure = exposureQuery.data;
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, exposure?.currency_code);

  async function onRun() {
    try {
      const created = await run.mutateAsync(asOf);
      toast.success(`Posted unrealized FX of ${created.total_gain_base}`);
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
            <Button type="button" disabled={run.isPending || !asOf} onClick={() => void onRun()}>
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Post revaluation
            </Button>
          ) : undefined
        }
      />
      <label className="flex w-48 flex-col gap-1 text-sm">
        As of
        <Input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
      </label>
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
            <TableHead>Foreign</TableHead>
            <TableHead>Book</TableHead>
            <TableHead>Revalued</TableHead>
            <TableHead>Gain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exposureQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
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
                <TableCell>{line.exposure_kind}</TableCell>
                <TableCell>{line.currency_code ?? line.currency_id}</TableCell>
                <TableCell>{line.foreign_balance}</TableCell>
                <TableCell>{money(line.book_base)}</TableCell>
                <TableCell>{money(line.revalued_base)}</TableCell>
                <TableCell>
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
      <h2 className="mt-4 text-lg font-semibold">Runs</h2>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>As of</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(runsQuery.data?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableEmpty title="No runs" message="Posted revaluations appear here." />
              </TableCell>
            </TableRow>
          ) : (
            runsQuery.data?.data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <RecordLink href={`/fx-revaluation/${row.id}`}>{row.as_of_date}</RecordLink>
                </TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.total_gain_base}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
