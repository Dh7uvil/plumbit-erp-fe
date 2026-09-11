"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useProfitAndLoss } from "@/modules/erp/accounting/reports/queries";
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

export function ProfitAndLossScreen() {
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const includeYtd = filters.include_ytd === "true";
  const branchId = filters.branch_id;
  const params = from && to ? { from, to, branch_id: branchId, include_ytd: includeYtd } : null;
  const reportQuery = useProfitAndLoss(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const showComparative = Boolean(report?.comparative_from);
  const showYtd = Boolean(report?.ytd_from);
  const columnCount = 4 + Number(showComparative) + Number(showYtd);

  return (
    <ReportShell
      title="Profit and loss"
      subtitle="Posted income and expense for the selected period. Totals come from the server."
      csvPending={csvPending}
      onDownloadCsv={
        params
          ? () => {
              void downloadCsv("/reports/profit-and-loss", params, "profit-and-loss");
            }
          : undefined
      }
      toolbar={
        <StatementReportFilters
          from={from}
          to={to}
          branchId={branchId}
          includeYtd={includeYtd}
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
            {showComparative ? <TableHead>Comparative</TableHead> : null}
            {showYtd ? <TableHead>YTD</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load the profit and loss."
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
                <DataTableEmpty title="No activity" message="No posted income or expense in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow key={line.account_id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={glHref(line.account_id, from, to, branchId)}>
                      {line.account_code}
                    </RecordLink>
                  </TableCell>
                  <TableCell>
                    <RecordLink href={glHref(line.account_id, from, to, branchId)}>
                      {line.account_name}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{line.account_subtype || line.account_type}</TableCell>
                  <TableCell>{formatDecimal(line.amount)}</TableCell>
                  {showComparative ? (
                    <TableCell>
                      {line.comparative_amount ? formatDecimal(line.comparative_amount) : "—"}
                    </TableCell>
                  ) : null}
                  {showYtd ? (
                    <TableCell>{line.ytd_amount ? formatDecimal(line.ytd_amount) : "—"}</TableCell>
                  ) : null}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total income
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_income)}</TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total expense
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_expense)}</TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Net profit
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.net_profit)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_net_profit
                      ? formatDecimal(report.comparative_net_profit)
                      : "—"}
                  </TableCell>
                ) : null}
                {showYtd ? (
                  <TableCell className="font-medium">
                    {report.ytd_net_profit ? formatDecimal(report.ytd_net_profit) : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
