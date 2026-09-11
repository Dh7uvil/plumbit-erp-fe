"use client";

import { InventoryReportFilters } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useStockMovementReport } from "@/modules/erp/accounting/reports/queries";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function StockMovementReportScreen() {
  const can = useCan();
  const canSeeCost = can(stockPermissions.costRead);
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const params = from && to
    ? {
        from,
        to,
        warehouse_id: filters.warehouse_id,
        product_id: filters.product_id,
        category_id: filters.category_id,
      }
    : null;
  const reportQuery = useStockMovementReport(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const columnCount = canSeeCost ? 11 : 7;

  return (
    <ReportShell
      title="Stock movement"
      subtitle="Opening, inbound, outbound, and closing quantity for the selected period"
      csvPending={csvPending}
      onDownloadCsv={
        params
          ? () => {
              void downloadCsv("/reports/stock-movement", params, "stock-movement");
            }
          : undefined
      }
      toolbar={
        <InventoryReportFilters
          from={from}
          to={to}
          warehouseId={filters.warehouse_id}
          productId={filters.product_id}
          categoryId={filters.category_id}
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Warehouse</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Opening qty</TableHead>
            {canSeeCost ? <TableHead>Opening value</TableHead> : null}
            <TableHead>Qty in</TableHead>
            {canSeeCost ? <TableHead>Value in</TableHead> : null}
            <TableHead>Qty out</TableHead>
            {canSeeCost ? <TableHead>Value out</TableHead> : null}
            <TableHead>Closing qty</TableHead>
            {canSeeCost ? <TableHead>Closing value</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load stock movement."
                />
              </TableCell>
            </TableRow>
          ) : reportQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columnCount}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableEmpty title="No movement" message="No posted stock movement in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow key={`${line.warehouse_id}-${line.product_id}`}>
                  <TableCell>
                    {line.warehouse_code} — {line.warehouse_name}
                  </TableCell>
                  <TableCell>
                    <RecordLink href={`/stock/${line.product_id}`}>{line.sku}</RecordLink>
                  </TableCell>
                  <TableCell>
                    <RecordLink href={`/stock/${line.product_id}`}>{line.product_name}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDecimal(line.opening_qty)}</TableCell>
                  {canSeeCost ? <TableCell>{formatDecimal(line.opening_value)}</TableCell> : null}
                  <TableCell>{formatDecimal(line.qty_in)}</TableCell>
                  {canSeeCost ? <TableCell>{formatDecimal(line.value_in)}</TableCell> : null}
                  <TableCell>{formatDecimal(line.qty_out)}</TableCell>
                  {canSeeCost ? <TableCell>{formatDecimal(line.value_out)}</TableCell> : null}
                  <TableCell>{formatDecimal(line.closing_qty)}</TableCell>
                  {canSeeCost ? <TableCell>{formatDecimal(line.closing_value)}</TableCell> : null}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_opening_qty)}</TableCell>
                {canSeeCost ? (
                  <TableCell className="font-medium">{formatDecimal(report.total_opening_value)}</TableCell>
                ) : null}
                <TableCell />
                {canSeeCost ? <TableCell /> : null}
                <TableCell />
                {canSeeCost ? <TableCell /> : null}
                <TableCell className="font-medium">{formatDecimal(report.total_closing_qty)}</TableCell>
                {canSeeCost ? (
                  <TableCell className="font-medium">{formatDecimal(report.total_closing_value)}</TableCell>
                ) : null}
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
