"use client";

import {
  useOutstandingBills,
  useOutstandingInvoices,
} from "@/modules/erp/accounting/reports/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { documentDetailHref } from "@/shared/components/document/document-links";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatReportMoney } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function OutstandingDocumentsScreen({ kind }: { kind: "invoices" | "bills" }) {
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of || todayIsoDate();
  const invoicesQuery = useOutstandingInvoices(kind === "invoices" ? asOf : null);
  const billsQuery = useOutstandingBills(kind === "bills" ? asOf : null);
  const reportQuery = kind === "invoices" ? invoicesQuery : billsQuery;
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const path = kind === "invoices" ? "/reports/outstanding-invoices" : "/reports/outstanding-bills";
  const filename = kind === "invoices" ? "outstanding-invoices" : "outstanding-bills";
  const money = (value: string | null | undefined, currency?: string | null) =>
    formatReportMoney(value, currency ?? report?.currency_code);

  return (
    <ReportShell
      title={kind === "invoices" ? "Outstanding invoices" : "Outstanding bills"}
      subtitle="Open documents from posted invoices and opening items, as of the selected date."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv(path, { as_of: asOf }, filename);
      }}
      onDownloadExcel={() => {
        void downloadExcel(path, { as_of: asOf }, filename);
      }}
      toolbar={
        <div className="flex flex-wrap items-end gap-2">
          <ToolbarControl label="As of" htmlFor="outstanding-as-of">
            <Input
              id="outstanding-as-of"
              type="date"
              value={asOf}
              onChange={(event) => setParams({ filters: { as_of: event.target.value || null } })}
            />
          </ToolbarControl>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => setParams({ filters: { as_of: null } })}
          >
            Clear
          </Button>
        </div>
      }
    >
      {report ? (
        <p className="text-muted-foreground text-sm">
          Document total {money(report.total_balance)}. Base total{" "}
          {money(report.total_base_balance, report.currency_code)}.
        </p>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>{kind === "invoices" ? "Customer" : "Supplier"}</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Bucket</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Base</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={7}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={7}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <DataTableEmpty
                  title="No open documents"
                  message="Nothing is outstanding as of this date."
                />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={`${line.item_type}-${line.document_id}`}>
                <TableCell>
                  <RecordLink
                    href={
                      kind === "invoices"
                        ? `/customers/${line.party_id}`
                        : `/suppliers/${line.party_id}`
                    }
                  >
                    {line.party_name}
                  </RecordLink>
                </TableCell>
                <TableCell>
                  {documentDetailHref(line.item_type, line.document_id) ? (
                    <RecordLink href={documentDetailHref(line.item_type, line.document_id)!}>
                      {line.document_number}
                    </RecordLink>
                  ) : (
                    line.document_number
                  )}
                </TableCell>
                <TableCell>{formatDate(line.document_date)}</TableCell>
                <TableCell>{formatDate(line.due_date)}</TableCell>
                <TableCell>{line.bucket.replaceAll("_", " ")}</TableCell>
                <TableCell>{money(line.balance, line.currency_code)}</TableCell>
                <TableCell>{money(line.base_balance, report.currency_code)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
