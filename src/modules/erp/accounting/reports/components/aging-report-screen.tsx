"use client";

import { useArAging, useApAging } from "@/modules/erp/accounting/reports/queries";
import type { AgingBucketTotals, AgingPartyRow } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 8;

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function BucketCells({ row }: { row: AgingBucketTotals }) {
  return (
    <>
      <TableCell className="tabular-nums">{formatDecimal(row.current)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.days_1_30)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.days_31_60)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.days_61_90)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.days_91_plus)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.unapplied_credits)}</TableCell>
      <TableCell className="tabular-nums">{formatDecimal(row.total)}</TableCell>
    </>
  );
}

export function AgingReportScreen({ kind }: { kind: "ar" | "ap" }) {
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of || todayIsoDate();
  const arQuery = useArAging(kind === "ar" ? { as_of: asOf } : null);
  const apQuery = useApAging(kind === "ap" ? { as_of: asOf } : null);
  const reportQuery = kind === "ar" ? arQuery : apQuery;
  const report = reportQuery.data;
  const rows = report?.rows ?? [];
  const partyHref = (row: AgingPartyRow) =>
    kind === "ar" ? `/customers/${row.party_id}` : `/suppliers/${row.party_id}`;

  return (
    <ListPage>
      <PageHeader
        title={kind === "ar" ? "AR aging" : "AP aging"}
        subtitle={
          kind === "ar"
            ? "Open receivables by customer as of the selected date. Totals come from the server."
            : "Open payables by supplier as of the selected date. Totals come from the server."
        }
      />
      <DataTableToolbar>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="aging-as-of">As of</Label>
          <Input
            id="aging-as-of"
            type="date"
            value={asOf}
            onChange={(event) => setParams({ filters: { as_of: event.target.value || null } })}
          />
        </div>
      </DataTableToolbar>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>{kind === "ar" ? "Customer" : "Supplier"}</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>1–30</TableHead>
            <TableHead>31–60</TableHead>
            <TableHead>61–90</TableHead>
            <TableHead>91+</TableHead>
            <TableHead>Unapplied credits</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="No open items"
                  message="Nothing is outstanding as of this date."
                />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => (
                <TableRow key={row.party_id}>
                  <TableCell>
                    <RecordLink href={partyHref(row)}>{row.party_name}</RecordLink>
                  </TableCell>
                  <BucketCells row={row} />
                </TableRow>
              ))}
              {report ? (
                <TableRow>
                  <TableCell className="font-medium">Totals</TableCell>
                  <BucketCells row={report.totals} />
                </TableRow>
              ) : null}
            </>
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
