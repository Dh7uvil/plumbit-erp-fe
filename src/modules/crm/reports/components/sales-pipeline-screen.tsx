"use client";

import { CrmReportFilters } from "@/modules/crm/reports/components/crm-report-filters";
import { CrmReportTable } from "@/modules/crm/reports/components/crm-report-table";
import { useCrmReportCsv } from "@/modules/crm/reports/hooks/use-crm-report-csv";
import { useSalesPipeline } from "@/modules/crm/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { ReportShell } from "@/shared/components/report/report-shell";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatReportMoney } from "@/shared/lib/format";

const GROUPS = [
  { value: "stage", label: "By stage" },
  { value: "owner", label: "By owner" },
  { value: "source", label: "By source" },
  { value: "campaign", label: "By campaign" },
];

export function SalesPipelineScreen() {
  const { filters, setParams } = useTableParams();
  const groupBy = filters.group_by || "stage";
  const pipelineId = filters.pipeline_id;
  const params = { group_by: groupBy, pipeline_id: pipelineId };
  const reportQuery = useSalesPipeline(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useCrmReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="Sales pipeline"
      subtitle="Open opportunities by stage, owner, source, or campaign. Weighted value uses each opportunity's probability."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/sales-pipeline", params, "sales-pipeline");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/sales-pipeline", params, "sales-pipeline");
      }}
      toolbar={
        <CrmReportFilters
          groupBy={groupBy}
          groupOptions={GROUPS}
          pipelineId={pipelineId}
          showPipeline
          showGroupBy
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <CrmReportTable
        columns={["Group", "Opportunities", "Amount", "Weighted amount"]}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        errorMessage={getErrorMessage(reportQuery.error)}
        onRetry={() => reportQuery.refetch()}
        emptyTitle="No open opportunities"
        emptyMessage="Open pipeline value will appear here."
        truncated={report?.truncated}
        isEmpty={!report || report.lines.length === 0}
        rows={report?.lines.map((line) => (
          <TableRow key={line.group_key}>
            <TableCell>{line.group_label}</TableCell>
            <TableCell>{line.opportunity_count}</TableCell>
            <TableCell>{money(line.amount)}</TableCell>
            <TableCell>{money(line.weighted_amount)}</TableCell>
          </TableRow>
        ))}
        footer={
          report ? (
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{report.opportunity_count}</TableCell>
              <TableCell className="font-medium">{money(report.total_amount)}</TableCell>
              <TableCell className="font-medium">{money(report.total_weighted_amount)}</TableCell>
            </TableRow>
          ) : null
        }
      />
    </ReportShell>
  );
}
