"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useCatchUpInventoryGl } from "@/modules/erp/accounting/opening-balances/mutations";
import { openingBalancePermissions } from "@/modules/erp/accounting/opening-balances/permissions";
import { reportsApi } from "@/modules/erp/accounting/reports/api";
import {
  InventoryReportFilters,
  todayIsoDate,
} from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { useStockValuationGl } from "@/modules/erp/accounting/reports/queries";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function StockValuationGlScreen() {
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
  const reportQuery = useStockValuationGl(params);
  const report = reportQuery.data;
  const [csvPending, setCsvPending] = useState(false);
  const [confirmCatchUp, setConfirmCatchUp] = useState(false);
  const catchUp = useCatchUpInventoryGl();
  const canCatchUp = can(openingBalancePermissions.manage);
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const outOfBalance = report ? !/^-?0+(?:\.0+)?$/.test(report.difference.trim()) : false;

  return (
    <ReportShell
      title="Stock valuation vs GL"
      subtitle="FIFO valuation compared with the inventory control account"
      csvPending={csvPending}
      csvDisabled={!canSeeCost}
      onDownloadCsv={
        canSeeCost
          ? async () => {
              setCsvPending(true);
              try {
                await reportsApi.downloadCsv(
                  "/reports/stock-valuation-gl",
                  params,
                  "stock-valuation-gl",
                );
              } catch (error) {
                toast.error(getErrorMessage(error));
              } finally {
                setCsvPending(false);
              }
            }
          : undefined
      }
      isBalanced={report ? /^-?0+(?:\.0+)?$/.test(report.difference.trim()) : undefined}
      imbalanceMessage="Inventory valuation does not match the inventory GL balance. Post an inventory catch-up journal to debit or credit Inventory against Opening Balance Equity without recreating stock layers."
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
      {outOfBalance && canCatchUp ? (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Post a catch-up journal for the valuation vs GL difference. This does not recreate
              stock layers.
            </span>
            <Button type="button" size="sm" onClick={() => setConfirmCatchUp(true)}>
              Post inventory catch-up
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>As of</TableHead>
            <TableHead>Valuation</TableHead>
            <TableHead>Inventory GL</TableHead>
            <TableHead>Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || !canSeeCost ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableEmpty
                  title={canSeeCost ? "No valuation" : "Cost hidden"}
                  message={
                    canSeeCost
                      ? "No inventory valuation for this date."
                      : "You need inventory cost permission to view this report."
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell>{report.as_of}</TableCell>
              <TableCell>{money(report.valuation_total)}</TableCell>
              <TableCell>
                {report.inventory_account_id ? (
                  <RecordLink href={glHref(report.inventory_account_id, asOf, asOf)}>
                    {money(report.gl_balance)}
                  </RecordLink>
                ) : (
                  money(report.gl_balance)
                )}
              </TableCell>
              <TableCell>{money(report.difference)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={confirmCatchUp}
        title="Post inventory catch-up"
        description="This posts a balanced journal for the current valuation minus inventory GL, against Opening Balance Equity. Existing stock layers are not recreated."
        confirmLabel="Post catch-up"
        pending={catchUp.isPending}
        onOpenChange={setConfirmCatchUp}
        onConfirm={() => {
          void (async () => {
            try {
              const result = await catchUp.mutateAsync(asOf);
              toast.success(
                result.posted
                  ? `Catch-up posted${result.document_number ? ` as ${result.document_number}` : ""}.`
                  : "Inventory already matches GL.",
              );
              setConfirmCatchUp(false);
              await reportQuery.refetch();
            } catch (error) {
              toast.error(getErrorMessage(error));
            }
          })();
        }}
      />
    </ReportShell>
  );
}
