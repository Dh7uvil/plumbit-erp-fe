"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useBalanceSheet } from "@/modules/erp/accounting/reports/queries";
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

const COLUMN_COUNT = 4;

export function BalanceSheetScreen() {
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of || todayIsoDate();
  const branchId = filters.branch_id;
  const params = { as_of: asOf, branch_id: branchId };
  const reportQuery = useBalanceSheet(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const showComparative = Boolean(report?.comparative_as_of);
  const columnCount = COLUMN_COUNT + Number(showComparative);

  return (
    <ReportShell
      title="Balance sheet"
      subtitle="Posted assets, liabilities, and equity as of the selected date"
      csvPending={csvPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/balance-sheet", params, "balance-sheet");
      }}
      isBalanced={report?.is_balanced}
      toolbar={
        <StatementReportFilters
          asOf={asOf}
          branchId={branchId}
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            {showComparative ? (
              <TableHead>
                {report?.comparative_as_of ? `As of ${report.comparative_as_of}` : "Comparative"}
              </TableHead>
            ) : null}
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
                <DataTableEmpty title="No balances" message="No posted balances at this date." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line, index) => (
                <TableRow key={line.account_id ?? `${line.account_code}-${index}`}>
                  <TableCell className="font-mono text-sm">
                    {line.account_id ? (
                      <RecordLink href={glHref(line.account_id, asOf, asOf, branchId)}>
                        {line.account_code}
                      </RecordLink>
                    ) : (
                      line.account_code
                    )}
                  </TableCell>
                  <TableCell>
                    {line.account_id ? (
                      <RecordLink href={glHref(line.account_id, asOf, asOf, branchId)}>
                        {line.account_name}
                      </RecordLink>
                    ) : (
                      line.account_name
                    )}
                  </TableCell>
                  <TableCell>{line.account_subtype || line.account_type}</TableCell>
                  <TableCell>{formatDecimal(line.amount)}</TableCell>
                  {showComparative ? (
                    <TableCell>
                      {line.comparative_amount ? formatDecimal(line.comparative_amount) : "—"}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total assets
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_assets)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_total_assets
                      ? formatDecimal(report.comparative_total_assets)
                      : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total liabilities
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_liabilities)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_total_liabilities
                      ? formatDecimal(report.comparative_total_liabilities)
                      : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total equity
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_equity)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_total_equity
                      ? formatDecimal(report.comparative_total_equity)
                      : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Current earnings
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.current_earnings)}</TableCell>
                {showComparative ? <TableCell /> : null}
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
