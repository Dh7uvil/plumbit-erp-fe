"use client";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useGeneralLedger } from "@/modules/erp/accounting/reports/queries";
import { sourceDocumentHref } from "@/modules/erp/accounting/reports/schemas";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
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
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 7;
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

export function GeneralLedgerScreen() {
  const can = useCan();
  const { page, page_size, filters, setParams, setPage } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const accountId = filters.account_id ?? "";
  const branchId = filters.branch_id;
  const sourceType = filters.source_type;
  const side = filters.side;
  const accountsQuery = useAllAccounts({ is_group: false });
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const reportParams = accountId
    ? {
        account_id: accountId,
        from,
        to,
        branch_id: branchId,
        source_type: sourceType,
        side,
        page,
        page_size,
      }
    : null;
  const reportQuery = useGeneralLedger(reportParams);
  const accounts = (accountsQuery.data ?? []).filter((row) => !row.is_group);
  const branches = branchesQuery.data ?? [];
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const csvParams = {
    account_id: accountId,
    from,
    to,
    branch_id: branchId,
    source_type: sourceType,
    side,
  };
  const pageSize = report?.page_size ?? page_size;
  const totalPages = pageSize > 0 ? Math.ceil((report?.total_lines ?? 0) / pageSize) : 1;

  return (
    <ReportShell
      title="General ledger"
      subtitle="Running balance per posted line"
      csvPending={csvPending}
      excelPending={excelPending}
      csvDisabled={!accountId}
      onDownloadCsv={
        accountId
          ? () => {
              void downloadCsv("/reports/general-ledger", csvParams, "general-ledger");
            }
          : undefined
      }
      onDownloadExcel={
        accountId
          ? () => {
              void downloadExcel("/reports/general-ledger", csvParams, "general-ledger");
            }
          : undefined
      }
      toolbar={
        <>
          <ToolbarControl label="Account" htmlFor="gl-account" className="min-w-[20ch]">
            <MasterSelect
              asFormControl={false}
              className="w-72"
              placeholder="Select account"
              searchPlaceholder="Search account…"
              aria-label="Account"
              value={accountId}
              onValueChange={(value) => setParams({ filters: { account_id: value || null } })}
              options={accounts.map((account) => ({
                value: account.id,
                label: `${account.code} — ${account.name}`,
              }))}
            />
          </ToolbarControl>
          <DateRangeFilter
            layout="inline"
            fromId="gl-from"
            toId="gl-to"
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
          {from || to || accountId || branchId || sourceType || side ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() =>
                setParams({
                  filters: {
                    from: null,
                    to: null,
                    account_id: null,
                    branch_id: null,
                    source_type: null,
                    side: null,
                  },
                })
              }
            >
              Clear
            </Button>
          ) : null}
        </>
      }
    >
      {report ? (
        <p className="text-muted-foreground text-sm">
          {report.account_code} {report.account_name}. Opening {money(report.opening_balance)}.
          Closing {money(report.closing_balance)}.
        </p>
      ) : null}
      <DataTable
        footer={
          report && accountId ? (
            <DataTablePagination
              meta={{
                page: report.page,
                page_size: pageSize,
                total: report.total_lines,
                total_pages: totalPages,
              }}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Running</TableHead>
            <TableHead>Narration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!accountId ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select an account"
                  message="Choose a postable account to load the general ledger."
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
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty title="No lines" message="No posted activity for this account." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={line.journal_entry_line_id}>
                <TableCell>{formatDate(line.entry_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/journals/${line.journal_entry_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>
                  {line.source_id ? (
                    <RecordLink
                      href={sourceDocumentHref(
                        line.source_type,
                        line.source_id,
                        line.journal_entry_id,
                      )}
                    >
                      {line.source_type ? documentTypeDisplayLabel(line.source_type) : "Journal"}
                    </RecordLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{money(line.debit_base)}</TableCell>
                <TableCell>{money(line.credit_base)}</TableCell>
                <TableCell>{money(line.running_balance)}</TableCell>
                <TableCell>{line.narration ?? line.description ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
