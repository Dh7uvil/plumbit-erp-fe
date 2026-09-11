"use client";

import { useReceivedNotBilled } from "@/modules/erp/accounting/reports/queries";
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

export function ReceivedNotBilledScreen() {
  const reportQuery = useReceivedNotBilled();
  const lines = reportQuery.data?.lines ?? [];

  return (
    <ListPage>
      <PageHeader
        title="Received not billed"
        subtitle="Posted goods receipt lines that still have quantity awaiting a purchase invoice."
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>GRN</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Outstanding qty</TableHead>
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
                  title="No unbilled receipts"
                  message="Every received line has been billed."
                />
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.goods_receipt_line_id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/goods-receipts/${line.goods_receipt_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>{formatDate(line.document_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/suppliers/${line.supplier_id}`}>{line.supplier_name}</RecordLink>
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.outstanding_qty)}</TableCell>
                <TableCell className="tabular-nums">{formatDecimal(line.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
