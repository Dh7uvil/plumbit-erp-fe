"use client";

import { useThreeWayMatch } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 8;

export function ThreeWayMatchScreen() {
  const reportQuery = useThreeWayMatch();
  const lines = reportQuery.data?.lines ?? [];

  return (
    <ListPage>
      <PageHeader
        title="Three-way match"
        subtitle="Ordered, received, and billed quantity and value by purchase order line."
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>PO</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Ordered</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Billed</TableHead>
            <TableHead>Status</TableHead>
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
                <DataTableEmpty title="No variances" message="Every purchase order line matches." />
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.purchase_order_line_id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/purchase-orders/${line.purchase_order_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>{formatDate(line.order_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/suppliers/${line.supplier_id}`}>{line.supplier_name}</RecordLink>
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.ordered_qty)}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.received_qty)}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.billed_qty)}</TableCell>
                <TableCell>{line.status.replaceAll("_", " ")}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
