"use client";

import { CrmReportFilters } from "@/modules/crm/reports/components/crm-report-filters";
import { CrmReportTable } from "@/modules/crm/reports/components/crm-report-table";
import { useCrmReportCsv } from "@/modules/crm/reports/hooks/use-crm-report-csv";
import { useWinLoss } from "@/modules/crm/reports/queries";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { getErrorMessage } from "@/shared/api/errors";
import { ReportShell } from "@/shared/components/report/report-shell";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatPercent, formatReportMoney } from "@/shared/lib/format";

const GROUPS = [
  { value: "lost_reason", label: "By lost reason" },
  { value: "owner", label: "By owner" },
  { value: "source", label: "By source" },
  { value: "campaign", label: "By campaign" },
];

export function WinLossScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const groupBy = filters.group_by || "lost_reason";
  const params = { from, to, group_by: groupBy };
  const reportQuery = useWinLoss(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useCrmReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="Win / loss"
      subtitle="Closed opportunities in the selected period. Win percent is won ÷ (won + lost)."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/win-loss", params, "win-loss");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/win-loss", params, "win-loss");
      }}
      toolbar={
        <CrmReportFilters
          from={from}
          to={to}
          groupBy={groupBy}
          groupOptions={GROUPS}
          showDates
          showGroupBy
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <CrmReportTable
        columns={["Group", "Won", "Lost", "Won amount", "Lost amount", "Win percent"]}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        errorMessage={getErrorMessage(reportQuery.error)}
        onRetry={() => reportQuery.refetch()}
        emptyTitle="No closed opportunities"
        emptyMessage="Won and lost opportunities in this range will appear here."
        truncated={report?.truncated}
        isEmpty={!report || report.lines.length === 0}
        rows={report?.lines.map((line) => (
          <TableRow key={line.group_key}>
            <TableCell>{line.group_label}</TableCell>
            <TableCell>{line.won_count}</TableCell>
            <TableCell>{line.lost_count}</TableCell>
            <TableCell>{money(line.won_amount)}</TableCell>
            <TableCell>{money(line.lost_amount)}</TableCell>
            <TableCell>{formatPercent(line.win_percent)}</TableCell>
          </TableRow>
        ))}
        footer={
          report ? (
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{report.won_count}</TableCell>
              <TableCell className="font-medium">{report.lost_count}</TableCell>
              <TableCell className="font-medium">{money(report.won_amount)}</TableCell>
              <TableCell className="font-medium">{money(report.lost_amount)}</TableCell>
              <TableCell className="font-medium">{formatPercent(report.win_percent)}</TableCell>
            </TableRow>
          ) : null
        }
      />
    </ReportShell>
  );
}
