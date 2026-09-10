"use client";

import { useExportEvidenceExceptions } from "@/modules/erp/accounting/reports/queries";
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
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 6;

export function ExportEvidenceExceptionsScreen() {
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of ?? "";
  const reportQuery = useExportEvidenceExceptions(asOf ? { as_of: asOf } : {});
  const report = reportQuery.data;
  const lines = report?.lines ?? [];

  return (
    <ListPage>
      <PageHeader
        title="Export evidence exceptions"
        subtitle="Posted zero-rated exports whose delivery notes have no BL or customs proof."
      />
      <DataTableToolbar>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eee-as-of">As of</Label>
          <Input
            id="eee-as-of"
            type="date"
            value={asOf}
            onChange={(event) => setParams({ filters: { as_of: event.target.value || null } })}
          />
        </div>
      </DataTableToolbar>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Grand total</TableHead>
            <TableHead>Days elapsed</TableHead>
            <TableHead>Window</TableHead>
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
          ) : lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="No exceptions"
                  message="Posted export invoices currently have BL or customs evidence."
                />
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.sales_invoice_id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/sales-invoices/${line.sales_invoice_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>{formatDate(line.invoice_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/customers/${line.customer_id}`}>{line.customer_name}</RecordLink>
                </TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.grand_total)}</TableCell>
                <TableCell className={line.overdue ? "text-destructive tabular-nums" : "tabular-nums"}>
                  {line.days_elapsed}
                  {line.overdue ? " overdue" : ""}
                </TableCell>
                <TableCell className="tabular-nums">{line.window_days}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
