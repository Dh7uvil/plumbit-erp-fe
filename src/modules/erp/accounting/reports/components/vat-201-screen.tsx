"use client";

import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useVat201 } from "@/modules/erp/accounting/reports/queries";
import { vat201BoxRegisterHref } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 4;

export function Vat201Screen() {
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const params = from && to ? { from, to } : null;
  const reportQuery = useVat201(params);
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();

  return (
    <ReportShell
      title="VAT 201"
      subtitle="FTA-style boxes from posted documents only. Figures come from the server."
      csvPending={csvPending}
      onDownloadCsv={
        params
          ? () => {
              void downloadCsv("/reports/vat-201", params, "vat-201");
            }
          : undefined
      }
      toolbar={
        <>
          <DateRangeFilter
            layout="inline"
            fromId="vat-201-from"
            toId="vat-201-to"
            from={from}
            to={to}
            onFromChange={(value) => setParams({ filters: { from: value || null } })}
            onToChange={(value) => setParams({ filters: { to: value || null } })}
          />
          {from || to ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => setParams({ filters: { from: null, to: null } })}
            >
              Clear
            </Button>
          ) : null}
        </>
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Box</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>VAT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load VAT 201."
                />
              </TableCell>
            </TableRow>
          ) : reportQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.boxes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty title="No boxes" message="No posted VAT activity in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.boxes.map((box) => (
                <TableRow key={box.code}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={vat201BoxRegisterHref(box, from, to)}>{box.code}</RecordLink>
                  </TableCell>
                  <TableCell>
                    <RecordLink href={vat201BoxRegisterHref(box, from, to)}>{box.label}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDecimal(box.net_amount)}</TableCell>
                  <TableCell>{formatDecimal(box.tax_amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Recoverable input VAT
                </TableCell>
                <TableCell className="font-medium">
                  {formatDecimal(report.recoverable_input_vat)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Net VAT
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.net_vat)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Export evidence exceptions
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href="/reports/export-evidence-exceptions">
                    {report.export_evidence_exceptions}
                  </RecordLink>
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
