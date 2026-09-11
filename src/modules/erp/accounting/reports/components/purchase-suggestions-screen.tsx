"use client";

import Link from "next/link";

import { InventoryReportFilters } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { usePurchaseSuggestions } from "@/modules/erp/accounting/reports/queries";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function createPurchaseOrderHref(line: {
  preferred_supplier_id: string | null;
  product_id: string;
  suggested_qty: string;
  warehouse_id: string;
}): string {
  const params = new URLSearchParams({
    product_id: line.product_id,
    quantity: line.suggested_qty,
    warehouse_id: line.warehouse_id,
  });
  if (line.preferred_supplier_id) {
    params.set("supplier_id", line.preferred_supplier_id);
  }
  return `/purchase-orders/new?${params.toString()}`;
}

export function PurchaseSuggestionsScreen() {
  const can = useCan();
  const canCreatePo = can(purchaseOrderPermissions.create);
  const { filters, setParams } = useTableParams();
  const params = {
    warehouse_id: filters.warehouse_id,
    product_id: filters.product_id,
    category_id: filters.category_id,
  };
  const reportQuery = usePurchaseSuggestions(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const columnCount = canCreatePo ? 9 : 8;

  return (
    <ReportShell
      title="Purchase suggestions"
      subtitle="Products at or below reorder level, grouped by preferred supplier"
      csvPending={csvPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/purchase-suggestions", params, "purchase-suggestions");
      }}
      toolbar={
        <InventoryReportFilters
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
            <TableHead>On hand</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Suggested qty</TableHead>
            <TableHead>Reorder</TableHead>
            <TableHead>Preferred supplier</TableHead>
            {canCreatePo ? <TableHead /> : null}
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
                <DataTableEmpty
                  title="No suggestions"
                  message="No products are at or below reorder level."
                />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
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
                <TableCell>{formatDecimal(line.qty_on_hand)}</TableCell>
                <TableCell>{formatDecimal(line.qty_available)}</TableCell>
                <TableCell>{formatDecimal(line.suggested_qty)}</TableCell>
                <TableCell>
                  {line.reorder_level ? formatDecimal(line.reorder_level) : "—"}
                  {line.reorder_qty ? ` / ${formatDecimal(line.reorder_qty)}` : ""}
                </TableCell>
                <TableCell>
                  {line.preferred_supplier_id && line.preferred_supplier_name ? (
                    <RecordLink href={`/suppliers/${line.preferred_supplier_id}`}>
                      {line.preferred_supplier_name}
                    </RecordLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
                {canCreatePo ? (
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={createPurchaseOrderHref(line)}>Create PO</Link>
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
