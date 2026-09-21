"use client";

import { CrmReportFilters } from "@/modules/crm/reports/components/crm-report-filters";
import { CrmReportTable } from "@/modules/crm/reports/components/crm-report-table";
import { useCrmReportCsv } from "@/modules/crm/reports/hooks/use-crm-report-csv";
import { useSalesActivity } from "@/modules/crm/reports/queries";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { getErrorMessage } from "@/shared/api/errors";
import { ReportShell } from "@/shared/components/report/report-shell";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const GROUPS = [
  { value: "activity_type", label: "By type" },
  { value: "status", label: "By status" },
  { value: "owner", label: "By owner" },
];

export function SalesActivityScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const groupBy = filters.group_by || "activity_type";
  const params = { from, to, group_by: groupBy };
  const reportQuery = useSalesActivity(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useCrmReportCsv();

  return (
    <ReportShell
      title="Sales activity"
      subtitle="Tasks, calls, and meetings in the selected period. Overdue counts open activities past their due time."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/sales-activity", params, "sales-activity");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/sales-activity", params, "sales-activity");
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
        columns={["Group", "Activities", "Open", "Completed", "Overdue"]}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        errorMessage={getErrorMessage(reportQuery.error)}
        onRetry={() => reportQuery.refetch()}
        emptyTitle="No activities"
        emptyMessage="Scheduled activities in this range will appear here."
        truncated={report?.truncated}
        isEmpty={!report || report.lines.length === 0}
        rows={report?.lines.map((line) => (
          <TableRow key={line.group_key}>
            <TableCell>{line.group_label}</TableCell>
            <TableCell>{line.activity_count}</TableCell>
            <TableCell>{line.open_count}</TableCell>
            <TableCell>{line.completed_count}</TableCell>
            <TableCell>{line.overdue_count}</TableCell>
          </TableRow>
        ))}
        footer={
          report ? (
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{report.activity_count}</TableCell>
              <TableCell className="font-medium">{report.open_count}</TableCell>
              <TableCell className="font-medium">{report.completed_count}</TableCell>
              <TableCell className="font-medium">{report.overdue_count}</TableCell>
            </TableRow>
          ) : null
        }
      />
    </ReportShell>
  );
}
