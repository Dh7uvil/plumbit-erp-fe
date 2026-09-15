"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useCashFlow } from "@/modules/erp/accounting/reports/queries";
import { glHref } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
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

const COLUMN_COUNT = 2;

export function CashFlowScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const branchId = filters.branch_id;
  const params = { from, to, branch_id: branchId };
  const reportQuery = useCashFlow(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const showComparative = Boolean(report?.comparative_from);
  const columnCount = COLUMN_COUNT + Number(showComparative);

  return (
    <ReportShell
      title="Cash flow"
      subtitle="Indirect cash flow from posted journals. Totals come from the server."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/cash-flow", params, "cash-flow");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/cash-flow", params, "cash-flow");
      }}
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
            {showComparative ? <TableHead>Comparative</TableHead> : null}
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
                  title="No cash flow"
                  message="No posted cash activity in this range."
                />
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
                  <TableCell>{money(line.amount)}</TableCell>
                  {showComparative ? (
                    <TableCell>
                      {line.comparative_amount ? money(line.comparative_amount) : "—"}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Net profit</TableCell>
                <TableCell className="font-medium">{money(report.net_profit)}</TableCell>
                {showComparative ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Opening cash</TableCell>
                <TableCell className="font-medium">{money(report.cash_opening)}</TableCell>
                {showComparative ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Closing cash</TableCell>
                <TableCell className="font-medium">{money(report.cash_closing)}</TableCell>
                {showComparative ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Net change</TableCell>
                <TableCell className="font-medium">{money(report.net_change)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_net_change ? money(report.comparative_net_change) : "—"}
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
