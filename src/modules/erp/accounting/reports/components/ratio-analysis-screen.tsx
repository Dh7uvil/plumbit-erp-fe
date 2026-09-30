"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useRatioAnalysis } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
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
import { formatFixedDecimal, formatReportMoney } from "@/shared/lib/format";

function formatRatio(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }
  return formatFixedDecimal(value, 2);
}

export function RatioAnalysisScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const params = { from, to };
  const reportQuery = useRatioAnalysis(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="Ratio analysis"
      subtitle="Liquidity, leverage, and margin ratios from posted balances and P&amp;L."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/ratio-analysis", params, "ratio-analysis");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/ratio-analysis", params, "ratio-analysis");
      }}
      toolbar={
        <StatementReportFilters
          from={from}
          to={to}
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Ratio</TableHead>
            <TableHead>Numerator</TableHead>
            <TableHead>Denominator</TableHead>
            <TableHead>Value</TableHead>
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
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableEmpty title="No ratios" message="No data for this period." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={line.key}>
                <TableCell>{line.label}</TableCell>
                <TableCell>{money(line.numerator)}</TableCell>
                <TableCell>{money(line.denominator)}</TableCell>
                <TableCell>{formatRatio(line.value)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
