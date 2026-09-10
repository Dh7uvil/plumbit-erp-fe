"use client";

import { useInvoicedNotDispatched } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 6;

export function InvoicedNotDispatchedScreen() {
  const reportQuery = useInvoicedNotDispatched();
  const lines = reportQuery.data?.lines ?? [];

  return (
    <ListPage>
      <PageHeader
        title="Invoiced not dispatched"
        subtitle="Invoice lines whose COGS is still pending because no delivery note has consumed stock."
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Amount</TableHead>
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
                  title="No pending COGS"
                  message="Every invoiced stockable line has a delivery note."
                />
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.sales_invoice_line_id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/sales-invoices/${line.sales_invoice_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>{formatDate(line.invoice_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/customers/${line.customer_id}`}>{line.customer_name}</RecordLink>
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.quantity)}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
