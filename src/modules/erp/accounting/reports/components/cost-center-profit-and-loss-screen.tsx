"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useCostCenterProfitAndLoss } from "@/modules/erp/accounting/reports/queries";
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

export function CostCenterProfitAndLossScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const branchId = filters.branch_id;
  const params = { from, to, branch_id: branchId };
  const reportQuery = useCostCenterProfitAndLoss(params);
  const report = reportQuery.data;
  const {
    csvPending,
    excelPending,
    pdfPending,
    queueMessage,
    downloadCsv,
    downloadExcel,
    queueExport,
  } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const exportParams = { from, to, ...(branchId ? { branch_id: branchId } : {}) };

  return (
    <ReportShell
      title="Cost center profit and loss"
      subtitle="Posted income and expense grouped by cost center."
      csvPending={csvPending}
      excelPending={excelPending}
      pdfPending={pdfPending}
      queueMessage={queueMessage}
      onDownloadCsv={() => {
        void downloadCsv(
          "/reports/cost-center-profit-and-loss",
          params,
          "cost-center-profit-and-loss",
        );
      }}
      onDownloadExcel={() => {
        void downloadExcel(
          "/reports/cost-center-profit-and-loss",
          params,
          "cost-center-profit-and-loss",
        );
      }}
      onDownloadPdf={() => {
        void queueExport("cost-center-profit-and-loss", "pdf", exportParams);
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
            <TableHead>Cost center</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={3}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.sections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <DataTableEmpty
                  title="No activity"
                  message="No posted profit and loss by cost center."
                />
              </TableCell>
            </TableRow>
          ) : (
            report.sections.flatMap((section) => [
              <TableRow key={section.cost_center_id ?? "unassigned"}>
                <TableCell className="bg-muted/40 font-medium" colSpan={3}>
                  {section.cost_center_code} — {section.cost_center_name} · net{" "}
                  {money(section.net_profit)}
                </TableCell>
              </TableRow>,
              ...section.lines.map((line) => (
                <TableRow key={`${section.cost_center_id ?? "none"}-${line.account_id}`}>
                  <TableCell />
                  <TableCell>
                    <RecordLink href={glHref(line.account_id, from, to, branchId)}>
                      {line.account_code} — {line.account_name}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{money(line.amount)}</TableCell>
                </TableRow>
              )),
            ])
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
