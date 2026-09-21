"use client";

import { CrmReportFilters } from "@/modules/crm/reports/components/crm-report-filters";
import { CrmReportTable } from "@/modules/crm/reports/components/crm-report-table";
import { useCrmReportCsv } from "@/modules/crm/reports/hooks/use-crm-report-csv";
import { useLeadConversion } from "@/modules/crm/reports/queries";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { getErrorMessage } from "@/shared/api/errors";
import { ReportShell } from "@/shared/components/report/report-shell";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatPercent } from "@/shared/lib/format";

const GROUPS = [
  { value: "status", label: "By status" },
  { value: "source", label: "By source" },
  { value: "owner", label: "By owner" },
  { value: "campaign", label: "By campaign" },
];

export function LeadConversionScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const groupBy = filters.group_by || "status";
  const params = { from, to, group_by: groupBy };
  const reportQuery = useLeadConversion(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useCrmReportCsv();

  return (
    <ReportShell
      title="Lead conversion"
      subtitle="Leads created in the selected period. Conversion percent is converted ÷ total."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/lead-conversion", params, "lead-conversion");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/lead-conversion", params, "lead-conversion");
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
        columns={["Group", "Leads", "Converted", "Conversion"]}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        errorMessage={getErrorMessage(reportQuery.error)}
        onRetry={() => reportQuery.refetch()}
        emptyTitle="No leads"
        emptyMessage="Leads created in this range will appear here."
        truncated={report?.truncated}
        isEmpty={!report || report.lines.length === 0}
        rows={report?.lines.map((line) => (
          <TableRow key={line.group_key}>
            <TableCell>{line.group_label}</TableCell>
            <TableCell>{line.lead_count}</TableCell>
            <TableCell>{line.converted_count}</TableCell>
            <TableCell>{formatPercent(line.conversion_percent)}</TableCell>
          </TableRow>
        ))}
        footer={
          report ? (
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{report.lead_count}</TableCell>
              <TableCell className="font-medium">{report.converted_count}</TableCell>
              <TableCell className="font-medium">
                {formatPercent(report.conversion_percent)}
              </TableCell>
            </TableRow>
          ) : null
        }
      />
    </ReportShell>
  );
}
