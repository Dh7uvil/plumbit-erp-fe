"use client";

import { CrmReportFilters } from "@/modules/crm/reports/components/crm-report-filters";
import { CrmReportTable } from "@/modules/crm/reports/components/crm-report-table";
import { useCrmReportCsv } from "@/modules/crm/reports/hooks/use-crm-report-csv";
import { useSalesFunnel } from "@/modules/crm/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { ReportShell } from "@/shared/components/report/report-shell";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatPercent, formatReportMoney } from "@/shared/lib/format";

export function SalesFunnelScreen() {
  const { filters, setParams } = useTableParams();
  const pipelineId = filters.pipeline_id;
  const params = { pipeline_id: pipelineId };
  const reportQuery = useSalesFunnel(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useCrmReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="Sales funnel"
      subtitle={
        report
          ? `Current opportunities in ${report.pipeline_name}, with conversion from the previous stage.`
          : "Current opportunities in each pipeline stage, with conversion from the previous stage."
      }
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/sales-funnel", params, "sales-funnel");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/sales-funnel", params, "sales-funnel");
      }}
      toolbar={
        <CrmReportFilters
          pipelineId={pipelineId}
          showPipeline
          allPipelineLabel="Default pipeline"
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <CrmReportTable
        columns={["Stage", "Kind", "Opportunities", "Amount", "Weighted amount", "Conversion"]}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        errorMessage={getErrorMessage(reportQuery.error)}
        onRetry={() => reportQuery.refetch()}
        emptyTitle="No funnel stages"
        emptyMessage="Configure a pipeline to see the funnel."
        isEmpty={!report || report.lines.length === 0}
        rows={report?.lines.map((line) => (
          <TableRow key={line.stage_id}>
            <TableCell>{line.stage_name}</TableCell>
            <TableCell>{line.stage_kind}</TableCell>
            <TableCell>{line.opportunity_count}</TableCell>
            <TableCell>{money(line.amount)}</TableCell>
            <TableCell>{money(line.weighted_amount)}</TableCell>
            <TableCell>{formatPercent(line.conversion_percent)}</TableCell>
          </TableRow>
        ))}
        footer={
          report ? (
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell className="font-medium">{report.opportunity_count}</TableCell>
              <TableCell className="font-medium">{money(report.total_amount)}</TableCell>
              <TableCell className="font-medium">{money(report.total_weighted_amount)}</TableCell>
              <TableCell />
            </TableRow>
          ) : null
        }
      />
    </ReportShell>
  );
}
