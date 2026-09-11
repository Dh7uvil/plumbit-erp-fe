"use client";

import { useState } from "react";
import { toast } from "sonner";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import { InventoryReportFilters, todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { useStockValuation } from "@/modules/erp/accounting/reports/queries";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function StockValuationScreen() {
  const can = useCan();
  const canSeeCost = can(stockPermissions.costRead);
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of || todayIsoDate();
  const params = {
    as_of: asOf,
    warehouse_id: filters.warehouse_id,
    product_id: filters.product_id,
    category_id: filters.category_id,
  };
  const reportQuery = useStockValuation(params);
  const report = reportQuery.data;
  const [csvPending, setCsvPending] = useState(false);
  const columnCount = canSeeCost ? 7 : 5;

  return (
    <ReportShell
      title="Stock valuation"
      subtitle="FIFO layers at landed unit cost as of the selected date"
      csvPending={csvPending}
      onDownloadCsv={async () => {
        setCsvPending(true);
        try {
          await reportsApi.downloadCsv("/reports/stock-valuation", params, "stock-valuation");
        } catch (error) {
          toast.error(getErrorMessage(error));
        } finally {
          setCsvPending(false);
        }
      }}
      toolbar={
        <InventoryReportFilters
          asOf={asOf}
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
            <TableHead>Date</TableHead>
            <TableHead>Qty</TableHead>
            {canSeeCost ? <TableHead>Unit cost</TableHead> : null}
            {canSeeCost ? <TableHead>Value</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
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
                <DataTableEmpty title="No layers" message="No remaining stock at this date." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow key={line.layer_id}>
                  <TableCell>
                    {line.warehouse_code} — {line.warehouse_name}
                  </TableCell>
                  <TableCell>
                    <RecordLink href={`/stock/${line.product_id}`}>{line.sku}</RecordLink>
                  </TableCell>
                  <TableCell>
                    <RecordLink href={`/stock/${line.product_id}`}>{line.product_name}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(line.document_date)}</TableCell>
                  <TableCell>{formatDecimal(line.qty_remaining)}</TableCell>
                  {canSeeCost ? <TableCell>{formatDecimal(line.landed_unit_cost)}</TableCell> : null}
                  {canSeeCost ? <TableCell>{formatDecimal(line.stock_value)}</TableCell> : null}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_qty)}</TableCell>
                {canSeeCost ? <TableCell /> : null}
                {canSeeCost ? (
                  <TableCell className="font-medium">{formatDecimal(report.total_value)}</TableCell>
                ) : null}
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
