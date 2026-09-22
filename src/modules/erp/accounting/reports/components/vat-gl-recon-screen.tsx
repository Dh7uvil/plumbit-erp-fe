"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useVatGlRecon } from "@/modules/erp/accounting/reports/queries";
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

export function VatGlReconScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const params = { from, to };
  const reportQuery = useVatGlRecon(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="VAT GL recon"
      subtitle="VAT 201 box totals compared with VAT_INPUT and VAT_OUTPUT movement."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/vat-gl-recon", params, "vat-gl-recon");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/vat-gl-recon", params, "vat-gl-recon");
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
            <TableHead>Line</TableHead>
            <TableHead>VAT 201</TableHead>
            <TableHead>GL</TableHead>
            <TableHead>Difference</TableHead>
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
                <DataTableEmpty
                  title="No VAT movement"
                  message="No VAT 201 or tax GL activity in this range."
                />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={line.key}>
                <TableCell>
                  {line.account_id ? (
                    <RecordLink href={glHref(line.account_id, from, to)}>{line.label}</RecordLink>
                  ) : (
                    line.label
                  )}
                </TableCell>
                <TableCell>{money(line.vat_201_amount)}</TableCell>
                <TableCell>{money(line.gl_amount)}</TableCell>
                <TableCell>{money(line.difference)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
