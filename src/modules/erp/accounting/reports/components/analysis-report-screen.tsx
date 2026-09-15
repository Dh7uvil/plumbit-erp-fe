"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { usePurchaseAnalysis, useSalesAnalysis } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
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

const SALES_GROUPS = [
  { value: "summary", label: "Summary" },
  { value: "customer", label: "By customer" },
  { value: "product", label: "By product" },
  { value: "date", label: "By date" },
  { value: "salesperson", label: "By salesperson" },
];
const PURCHASE_GROUPS = [
  { value: "summary", label: "Summary" },
  { value: "supplier", label: "By supplier" },
  { value: "product", label: "By product" },
  { value: "date", label: "By date" },
];

export function AnalysisReportScreen({ kind }: { kind: "sales" | "purchase" }) {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const groupBy = filters.group_by || "summary";
  const params = { from, to, group_by: groupBy };
  const salesQuery = useSalesAnalysis(kind === "sales" ? params : null);
  const purchaseQuery = usePurchaseAnalysis(kind === "purchase" ? params : null);
  const reportQuery = kind === "sales" ? salesQuery : purchaseQuery;
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const path = kind === "sales" ? "/reports/sales-analysis" : "/reports/purchase-analysis";
  const filename = kind === "sales" ? "sales-analysis" : "purchase-analysis";
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const groups = kind === "sales" ? SALES_GROUPS : PURCHASE_GROUPS;

  return (
    <ReportShell
      title={kind === "sales" ? "Sales analysis" : "Purchase analysis"}
      subtitle="Posted documents only. Credit and debit notes reduce the totals."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv(path, params, filename);
      }}
      onDownloadExcel={() => {
        void downloadExcel(path, params, filename);
      }}
      toolbar={
        <>
          <StatementReportFilters
            from={from}
            to={to}
            onChange={(patch) => setParams({ filters: patch })}
          />
          <FilterSelect
            label="Group by"
            className="w-44"
            placeholder="Group"
            value={groupBy}
            onValueChange={(value) => setParams({ filters: { group_by: value } })}
            options={groups}
          />
        </>
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Group</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Grand</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={5}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <DataTableEmpty title="No activity" message="No posted documents in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow key={line.group_key}>
                  <TableCell>{line.group_label}</TableCell>
                  <TableCell>{line.document_count}</TableCell>
                  <TableCell>{money(line.net_amount)}</TableCell>
                  <TableCell>{money(line.tax_amount)}</TableCell>
                  <TableCell>{money(line.grand_total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="font-medium">{report.document_count}</TableCell>
                <TableCell className="font-medium">{money(report.total_net)}</TableCell>
                <TableCell className="font-medium">{money(report.total_tax)}</TableCell>
                <TableCell className="font-medium">{money(report.total_grand)}</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
