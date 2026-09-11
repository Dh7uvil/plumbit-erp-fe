"use client";

import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { usePurchaseRegister, useSalesRegister } from "@/modules/erp/accounting/reports/queries";
import { taxRegisterLineMatchesBox } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { documentDetailHref } from "@/shared/components/document/document-links";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_COUNT = 11;

export function TaxRegisterScreen({ kind }: { kind: "sales" | "purchase" }) {
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const box = filters.box;
  const params = from && to ? { from, to } : null;
  const salesQuery = useSalesRegister(kind === "sales" ? params : null);
  const purchaseQuery = usePurchaseRegister(kind === "purchase" ? params : null);
  const reportQuery = kind === "sales" ? salesQuery : purchaseQuery;
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const path = kind === "sales" ? "/reports/sales-register" : "/reports/purchase-register";
  const filename = kind === "sales" ? "sales-register" : "purchase-register";
  const lines = (report?.lines ?? []).filter((line) =>
    box ? taxRegisterLineMatchesBox(line, box) : true,
  );

  return (
    <ReportShell
      title={kind === "sales" ? "Sales register" : "Purchase register"}
      subtitle={
        kind === "sales"
          ? "Posted sales invoices and credit notes for the selected period"
          : "Posted bills and debit notes for the selected period"
      }
      csvPending={csvPending}
      onDownloadCsv={
        params
          ? () => {
              void downloadCsv(path, params, filename);
            }
          : undefined
      }
      toolbar={
        <>
          <DateRangeFilter
            layout="inline"
            fromId={`${kind}-register-from`}
            toId={`${kind}-register-to`}
            from={from}
            to={to}
            onFromChange={(value) => setParams({ filters: { from: value || null } })}
            onToChange={(value) => setParams({ filters: { to: value || null } })}
          />
          {from || to || box ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => setParams({ filters: { from: null, to: null, box: null } })}
            >
              Clear
            </Button>
          ) : null}
        </>
      }
    >
      {box ? (
        <p className="text-muted-foreground text-sm">Filtered to VAT 201 box {box}.</p>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>{kind === "sales" ? "Customer" : "Supplier"}</TableHead>
            <TableHead>TRN</TableHead>
            <TableHead>Treatment</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Place of supply</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>VAT</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Flags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load the register."
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
          ) : lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty title="No documents" message="No posted tax documents in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {lines.map((line) => {
                const href = documentDetailHref(line.document_type, line.document_id);
                return (
                  <TableRow key={`${line.document_type}-${line.document_id}`}>
                    <TableCell>{formatDate(line.document_date)}</TableCell>
                    <TableCell>
                      {href ? (
                        <RecordLink href={href}>{line.document_number}</RecordLink>
                      ) : (
                        line.document_number
                      )}
                    </TableCell>
                    <TableCell>
                      <RecordLink
                        href={kind === "sales" ? `/customers/${line.party_id}` : `/suppliers/${line.party_id}`}
                      >
                        {line.party_name}
                      </RecordLink>
                    </TableCell>
                    <TableCell>{line.party_trn || "—"}</TableCell>
                    <TableCell>{line.tax_treatment}</TableCell>
                    <TableCell>{line.tax_category || "—"}</TableCell>
                    <TableCell>{line.place_of_supply}</TableCell>
                    <TableCell>{formatDecimal(line.net_amount)}</TableCell>
                    <TableCell>{formatDecimal(line.tax_amount)}</TableCell>
                    <TableCell>{formatDecimal(line.grand_total)}</TableCell>
                    <TableCell>
                      {[
                        line.is_export ? "Export" : null,
                        line.is_reverse_charge ? "RCM" : null,
                        line.is_designated_zone ? "Designated zone" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!box && report ? (
                <TableRow>
                  <TableCell colSpan={7} className="font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="font-medium">{formatDecimal(report.total_net)}</TableCell>
                  <TableCell className="font-medium">{formatDecimal(report.total_tax)}</TableCell>
                  <TableCell className="font-medium">{formatDecimal(report.total_grand)}</TableCell>
                  <TableCell />
                </TableRow>
              ) : null}
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
