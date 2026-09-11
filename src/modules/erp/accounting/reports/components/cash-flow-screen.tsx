"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useCashFlow } from "@/modules/erp/accounting/reports/queries";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 2;

export function CashFlowScreen() {
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const branchId = filters.branch_id;
  const params = from && to ? { from, to, branch_id: branchId } : null;
  const reportQuery = useCashFlow(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();

  return (
    <ReportShell
      title="Cash flow"
      subtitle="Indirect cash flow from posted journals. Totals come from the server."
      csvPending={csvPending}
      onDownloadCsv={
        params
          ? () => {
              void downloadCsv("/reports/cash-flow", params, "cash-flow");
            }
          : undefined
      }
      toolbar={
        <StatementReportFilters
          from={from}
          to={to}
          branchId={branchId}
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Line</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load the cash flow."
                />
              </TableCell>
            </TableRow>
          ) : reportQuery.isLoading ? (
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
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty title="No cash flow" message="No posted cash activity in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow key={line.key}>
                  <TableCell>
                    {line.account_id ? (
                      <RecordLink href={glHref(line.account_id, from, to, branchId)}>
                        {line.label}
                      </RecordLink>
                    ) : (
                      line.label
                    )}
                  </TableCell>
                  <TableCell>{formatDecimal(line.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Net profit</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.net_profit)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Opening cash</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.cash_opening)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Closing cash</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.cash_closing)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Net change</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.net_change)}</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
