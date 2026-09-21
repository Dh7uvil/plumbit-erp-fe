"use client";

import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ContraEntryDialog } from "@/modules/erp/accounting/journals/components/contra-entry-dialog";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useBankBook, useCashBook } from "@/modules/erp/accounting/reports/queries";
import { sourceDocumentHref } from "@/modules/erp/accounting/reports/schemas";
import type { DayBookLine } from "@/modules/erp/accounting/reports/schemas";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { documentTypeDisplayLabel } from "@/shared/components/document/document-links";
import { MasterSelect } from "@/shared/components/form/master-select";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 8;

const GL_SOURCE_TYPES = [
  { value: "sales_invoice", label: "Sales invoice" },
  { value: "purchase_invoice", label: "Purchase invoice" },
  { value: "credit_note", label: "Credit note" },
  { value: "debit_note", label: "Debit note" },
  { value: "customer_payment", label: "Customer receipt" },
  { value: "supplier_payment", label: "Supplier payment" },
  { value: "goods_receipt", label: "Goods receipt" },
  { value: "delivery_note", label: "Delivery note" },
  { value: "sales_return", label: "Sales return" },
  { value: "purchase_return", label: "Purchase return" },
  { value: "landed_cost", label: "Landed cost" },
  { value: "stock_adjustment", label: "Stock adjustment" },
  { value: "OPENING_BALANCE", label: "Opening balance" },
  { value: "INVENTORY_CATCH_UP", label: "Inventory catch-up" },
];

function rowLabel(line: DayBookLine): string {
  switch (line.row_type) {
    case "opening":
      return "Opening balance";
    case "day_total":
      return "Day total";
    case "closing":
      return "Closing balance";
    default:
      return line.document_number ?? "—";
  }
}

function DayBookRows({
  lines,
  money,
  showAccount,
}: {
  lines: DayBookLine[];
  money: (value: string | null | undefined) => string;
  showAccount: boolean;
}) {
  return lines.map((line, index) => {
    const sticky =
      line.row_type === "opening" ||
      line.row_type === "closing" ||
      line.row_type === "day_total";
    return (
      <TableRow
        key={`${line.row_type}-${line.entry_date}-${line.journal_entry_line_id ?? index}`}
        className={cn(sticky && "bg-muted/50 font-medium")}
      >
        <TableCell>{line.entry_date ? formatDate(line.entry_date) : "—"}</TableCell>
        {showAccount ? (
          <TableCell>
            {line.account_code ? `${line.account_code} ${line.account_name}` : "—"}
          </TableCell>
        ) : null}
        <TableCell>
          {line.row_type === "movement" && line.journal_entry_id ? (
            <RecordLink href={`/journals/${line.journal_entry_id}`}>{rowLabel(line)}</RecordLink>
          ) : (
            rowLabel(line)
          )}
        </TableCell>
        <TableCell>
          {line.row_type === "movement" && line.source_id ? (
            <RecordLink
              href={sourceDocumentHref(
                line.source_type,
                line.source_id,
                line.journal_entry_id ?? line.source_id,
              )}
            >
              {line.source_type ? documentTypeDisplayLabel(line.source_type) : "Journal"}
            </RecordLink>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>{line.row_type === "movement" || line.row_type === "day_total" ? money(line.debit) : "—"}</TableCell>
        <TableCell>{line.row_type === "movement" || line.row_type === "day_total" ? money(line.credit) : "—"}</TableCell>
        <TableCell>{money(line.running_balance)}</TableCell>
        <TableCell>{line.narration ?? line.description ?? "—"}</TableCell>
      </TableRow>
    );
  });
}

export function DayBookScreen({
  bookKind,
  title,
  subtitle,
  exportSlug,
  apiPath,
}: {
  bookKind: "cash" | "bank";
  title: string;
  subtitle: string;
  exportSlug: string;
  apiPath: "/reports/cash-book" | "/reports/bank-book";
}) {
  const can = useCan();
  const [contraOpen, setContraOpen] = useState(false);
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const accountId = filters.account_id;
  const branchId = filters.branch_id;
  const costCenterId = filters.cost_center_id;
  const sourceType = filters.source_type;
  const side = filters.side;
  const subtype = bookKind === "cash" ? "CASH" : "BANK";
  const accountsQuery = useAllAccounts({ is_group: false, account_subtype: subtype });
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const costCentersQuery = useAllCostCenters(can("masters.cost_center.read"));
  const reportParams = from && to ? { from, to, account_id: accountId, branch_id: branchId, cost_center_id: costCenterId, source_type: sourceType, side } : null;
  const cashQuery = useCashBook(bookKind === "cash" ? reportParams : null);
  const bankQuery = useBankBook(bookKind === "bank" ? reportParams : null);
  const reportQuery = bookKind === "cash" ? cashQuery : bankQuery;
  const accounts = accountsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const costCenters = costCentersQuery.data ?? [];
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const csvParams = {
    from,
    to,
    account_id: accountId,
    branch_id: branchId,
    cost_center_id: costCenterId,
    source_type: sourceType,
    side,
  };
  const showAccountColumn = !accountId && (report?.sections.length ?? 0) > 1;
  const displayLines = useMemo(() => {
    if (!report) {
      return [];
    }
    if (accountId || report.sections.length <= 1) {
      return report.sections[0]?.lines ?? report.lines;
    }
    return report.lines;
  }, [accountId, report]);

  return (
    <>
      <ReportShell
        title={title}
        subtitle={subtitle}
        csvPending={csvPending}
        excelPending={excelPending}
        onDownloadCsv={() => {
          void downloadCsv(apiPath, csvParams, exportSlug);
        }}
        onDownloadExcel={() => {
          void downloadExcel(apiPath, csvParams, exportSlug);
        }}
        toolbar={
          <>
            {can(journalPermissions.create) ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setContraOpen(true)}>
                <ArrowLeftRight className="mr-2 size-4" />
                Contra entry
              </Button>
            ) : null}
            <ToolbarControl label="Account" htmlFor={`${bookKind}-account`} className="min-w-[20ch]">
              <MasterSelect
                asFormControl={false}
                className="w-72"
                placeholder="All accounts"
                searchPlaceholder="Search account…"
                aria-label="Account"
                value={accountId ?? ALL}
                onValueChange={(value) =>
                  setParams({ filters: { account_id: value === ALL ? null : value } })
                }
                options={[
                  { value: ALL, label: "All accounts" },
                  ...accounts.map((account) => ({
                    value: account.id,
                    label: `${account.code} — ${account.name}`,
                  })),
                ]}
              />
            </ToolbarControl>
            <DateRangeFilter
              layout="inline"
              fromId={`${bookKind}-from`}
              toId={`${bookKind}-to`}
              from={from}
              to={to}
              onFromChange={(value) => setParams({ filters: { from: value || null } })}
              onToChange={(value) => setParams({ filters: { to: value || null } })}
            />
            <FilterSelect
              label="Source"
              className="w-44"
              placeholder="Source"
              value={sourceType ?? ALL}
              onValueChange={(value) =>
                setParams({ filters: { source_type: value === ALL ? null : value } })
              }
              options={[{ value: ALL, label: "All sources" }, ...GL_SOURCE_TYPES]}
            />
            <FilterSelect
              label="Side"
              className="w-32"
              placeholder="Side"
              value={side ?? ALL}
              onValueChange={(value) =>
                setParams({ filters: { side: value === ALL ? null : value } })
              }
              options={[
                { value: ALL, label: "Both" },
                { value: "debit", label: "Debit" },
                { value: "credit", label: "Credit" },
              ]}
            />
            <FilterSelect
              label="Branch"
              className="w-44"
              placeholder="Branch"
              value={branchId ?? ALL}
              onValueChange={(value) =>
                setParams({ filters: { branch_id: value === ALL ? null : value } })
              }
              options={[
                { value: ALL, label: "All branches" },
                ...branches.map((branch) => ({
                  value: branch.id,
                  label: `${branch.code} — ${branch.name}`,
                })),
              ]}
            />
            <FilterSelect
              label="Cost center"
              className="w-48"
              placeholder="Cost center"
              value={costCenterId ?? ALL}
              onValueChange={(value) =>
                setParams({ filters: { cost_center_id: value === ALL ? null : value } })
              }
              options={[
                { value: ALL, label: "All cost centers" },
                ...costCenters.map((row) => ({
                  value: row.id,
                  label: `${row.code} — ${row.name}`,
                })),
              ]}
            />
          </>
        }
      >
        {report ? (
          <p className="text-muted-foreground text-sm">
            Combined opening {money(report.combined_opening_balance)}. Combined closing{" "}
            {money(report.combined_closing_balance)}.
          </p>
        ) : null}
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showAccountColumn ? <TableHead>Account</TableHead> : null}
              <TableHead>Journal</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Narration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={showAccountColumn ? COLUMN_COUNT : COLUMN_COUNT - 1}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : reportQuery.isError ? (
              <TableRow>
                <TableCell colSpan={showAccountColumn ? COLUMN_COUNT : COLUMN_COUNT - 1}>
                  <DataTableError
                    message={getErrorMessage(reportQuery.error)}
                    onRetry={() => reportQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : !report || displayLines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAccountColumn ? COLUMN_COUNT : COLUMN_COUNT - 1}>
                  <DataTableEmpty title="No activity" message="No posted cash or bank lines in this period." />
                </TableCell>
              </TableRow>
            ) : (
              <DayBookRows lines={displayLines} money={money} showAccount={showAccountColumn} />
            )}
          </TableBody>
        </DataTable>
      </ReportShell>
      <ContraEntryDialog open={contraOpen} onOpenChange={setContraOpen} defaultBookKind={bookKind} />
    </>
  );
}
