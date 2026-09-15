"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";

import { useArAging, useApAging } from "@/modules/erp/accounting/reports/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import type {
  AgingBucketTotals,
  AgingDocument,
  AgingPartyRow,
} from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { documentDetailHref } from "@/shared/components/document/document-links";
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

const COLUMN_COUNT = 10;

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function BucketCells({
  row,
  currencyCode,
}: {
  row: AgingBucketTotals;
  currencyCode?: string | null;
}) {
  const money = (value: string | null | undefined) => formatReportMoney(value, currencyCode);
  return (
    <>
      <TableCell className="tabular-nums">{money(row.current)}</TableCell>
      <TableCell className="tabular-nums">{money(row.days_1_30)}</TableCell>
      <TableCell className="tabular-nums">{money(row.days_31_60)}</TableCell>
      <TableCell className="tabular-nums">{money(row.days_61_90)}</TableCell>
      <TableCell className="tabular-nums">{money(row.days_91_plus)}</TableCell>
      <TableCell className="tabular-nums">{money(row.unapplied_credits)}</TableCell>
      <TableCell className="tabular-nums">{money(row.total)}</TableCell>
    </>
  );
}

function documentHref(doc: AgingDocument): string | null {
  return documentDetailHref(doc.item_type, doc.document_id);
}

export function AgingReportScreen({ kind }: { kind: "ar" | "ap" }) {
  const { filters, setParams } = useTableParams();
  const asOf = filters.as_of || todayIsoDate();
  const arQuery = useArAging(kind === "ar" ? { as_of: asOf } : null);
  const apQuery = useApAging(kind === "ap" ? { as_of: asOf } : null);
  const reportQuery = kind === "ar" ? arQuery : apQuery;
  const report = reportQuery.data;
  const rows = report?.rows ?? [];
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const partyHref = (row: AgingPartyRow) =>
    kind === "ar" ? `/customers/${row.party_id}` : `/suppliers/${row.party_id}`;
  const path = kind === "ar" ? "/reports/ar-aging" : "/reports/ap-aging";
  const filename = kind === "ar" ? "ar-aging" : "ap-aging";
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(partyId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(partyId)) {
        next.delete(partyId);
      } else {
        next.add(partyId);
      }
      return next;
    });
  }

  return (
    <ReportShell
      title={kind === "ar" ? "AR aging" : "AP aging"}
      subtitle={
        kind === "ar"
          ? "Open receivables by customer as of the selected date. Document currency is labeled; base-currency totals appear below."
          : "Open payables by supplier as of the selected date. Document currency is labeled; base-currency totals appear below."
      }
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
          <ToolbarControl label="As of" htmlFor="aging-as-of">
            <Input
              id="aging-as-of"
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
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{kind === "ar" ? "Customer" : "Supplier"}</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>1–30</TableHead>
            <TableHead>31–60</TableHead>
            <TableHead>61–90</TableHead>
            <TableHead>91+</TableHead>
            <TableHead>Unapplied credits</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
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
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="No open items"
                  message="Nothing is outstanding as of this date."
                />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => {
                const isOpen = expanded.has(row.party_id);
                const docs = row.documents ?? [];
                return (
                  <Fragment key={row.party_id}>
                    <TableRow>
                      <TableCell>
                        {docs.length > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Collapse documents" : "Expand documents"}
                            onClick={() => toggle(row.party_id)}
                          >
                            {isOpen ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <RecordLink href={partyHref(row)}>{row.party_name}</RecordLink>
                      </TableCell>
                      <TableCell>{row.currency_code || report?.currency_code || "—"}</TableCell>
                      <BucketCells row={row} currencyCode={row.currency_code} />
                    </TableRow>
                    {isOpen
                      ? docs.map((doc) => {
                          const href = documentHref(doc);
                          return (
                            <TableRow
                              key={`${row.party_id}-${doc.document_id}`}
                              className="bg-muted/30"
                            >
                              <TableCell />
                              <TableCell colSpan={2} className="pl-8 text-sm">
                                {href ? (
                                  <RecordLink href={href}>{doc.document_number}</RecordLink>
                                ) : (
                                  doc.document_number
                                )}{" "}
                                <span className="text-muted-foreground">
                                  {formatDate(doc.document_date)}
                                  {doc.due_date ? ` · due ${formatDate(doc.due_date)}` : ""}
                                  {` · ${doc.bucket.replaceAll("_", " ")}`}
                                </span>
                              </TableCell>
                              <TableCell colSpan={5} />
                              <TableCell className="tabular-nums">
                                {formatReportMoney(doc.balance, doc.currency_code)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      : null}
                  </Fragment>
                );
              })}
              {(report?.currency_totals ?? []).map((row) => (
                <TableRow key={`currency-${row.currency_code}`}>
                  <TableCell />
                  <TableCell className="font-medium">{row.currency_code} totals</TableCell>
                  <TableCell>{row.currency_code}</TableCell>
                  <BucketCells row={row} currencyCode={row.currency_code} />
                </TableRow>
              ))}
              {report?.base_totals ? (
                <TableRow>
                  <TableCell />
                  <TableCell className="font-medium">
                    Base totals{report.currency_code ? ` (${report.currency_code})` : ""}
                  </TableCell>
                  <TableCell>{report.currency_code || "—"}</TableCell>
                  <BucketCells row={report.base_totals} currencyCode={report.currency_code} />
                </TableRow>
              ) : null}
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
