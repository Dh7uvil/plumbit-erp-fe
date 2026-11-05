"use client";

import { useMemo } from "react";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  reportBranchOptionSpec,
  reportPeriodDateRangeSpec,
} from "@/modules/erp/accounting/reports/components/report-filter-specs";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useGeneralLedger } from "@/modules/erp/accounting/reports/queries";
import {
  sourceDocumentHref,
  sourceTypeVoucherCode,
  type GeneralLedger,
} from "@/modules/erp/accounting/reports/schemas";
import {
  StatementOfAccountTable,
  type StatementOfAccountRow,
} from "@/modules/erp/accounting/reports/components/statement-of-account-view";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { AppliedFilterPills } from "@/shared/components/data-table/applied-filter-pills";
import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { MasterSelect } from "@/shared/components/form/master-select";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { isZeroDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 8;

function mapGeneralLedgerRows(report: GeneralLedger): StatementOfAccountRow[] {
  return report.lines.map((line) => ({
    key: line.journal_entry_line_id,
    date: line.entry_date,
    refNo: line.document_number,
    refHref: `/journals/${line.journal_entry_id}`,
    dateHref: sourceDocumentHref(
      line.source_type,
      line.source_id,
      line.journal_entry_id,
    ),
    typeCode: sourceTypeVoucherCode(line.source_type),
    debit: line.debit_base,
    credit: line.credit_base,
    runningBalance: line.running_balance,
    balanceSide: null,
    description: line.narration ?? line.description ?? undefined,
  }));
}
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
  { value: "landed_cost", label: "Landed cost (legacy)" },
  { value: "stock_adjustment", label: "Stock adjustment" },
  { value: "stock_transfer", label: "Stock transfer" },
  { value: "quality_inspection", label: "Quality inspection" },
  { value: "package", label: "Package" },
  { value: "shipment", label: "Shipment" },
  { value: "quotation", label: "Quotation" },
  { value: "sales_order", label: "Sales order" },
  { value: "purchase_order", label: "Purchase order" },
  { value: "journal_voucher", label: "Journal voucher" },
  { value: "contra_voucher", label: "Contra voucher" },
  { value: "cheque_issue", label: "Cheque issue" },
  { value: "cheque_clear", label: "Cheque clear" },
  { value: "cheque_bounce", label: "Cheque bounce" },
  { value: "cheque_bounce_charge", label: "Cheque bounce charge" },
  { value: "fx_revaluation", label: "FX revaluation" },
  { value: "year_end_closing", label: "Year-end closing" },
  { value: "grn_charge_adjustment", label: "GRN charge adjustment" },
  { value: "goods_receipt_charge_adjustment", label: "GRN charge adjustment (ledger)" },
  { value: "cash_receipt_voucher", label: "Cash receipt voucher" },
  { value: "cash_payment_voucher", label: "Cash payment voucher" },
  { value: "bank_receipt_voucher", label: "Bank receipt voucher" },
  { value: "bank_payment_voucher", label: "Bank payment voucher" },
  { value: "voucher_allocation", label: "Voucher allocation" },
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

  const filterSpecs = useMemo((): FilterSpec[] => {
    return [
      {
        type: "option",
        key: "account_id",
        label: "Account",
        options: accounts.map((account) => ({
          value: account.id,
          label: `${account.code} — ${account.name}`,
        })),
      },
      reportPeriodDateRangeSpec(),
      {
        type: "option",
        key: "source_type",
        label: "Source",
        options: GL_SOURCE_TYPES,
      },
      {
        type: "option",
        key: "side",
        label: "Side",
        options: [
          { value: "debit", label: "Debit" },
          { value: "credit", label: "Credit" },
        ],
      },
      reportBranchOptionSpec(branches),
    ];
  }, [accounts, branches]);

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
        </>
      }
      activeFilters={
        <AppliedFilterPills filters={filters} specs={filterSpecs} setParams={setParams} />
      }
    >
      {report && accountId && !reportQuery.isLoading && !reportQuery.isError ? (
        <StatementOfAccountTable
          header={{
            accountCode: report.account_code,
            accountName: report.account_name,
            from: report.from_date,
            to: report.to_date,
            pdcIncluded: false,
            previousBalanceIncluded: true,
            currencyCode: report.currency_code,
          }}
          openingRow={
            !isZeroDecimal(report.opening_balance)
              ? {
                  key: "__opening__",
                  date: report.from_date,
                  refNo: "—",
                  typeCode: "OP",
                  debit: "0",
                  credit: "0",
                  runningBalance: report.opening_balance,
                  description: "Previous balance",
                }
              : null
          }
          rows={mapGeneralLedgerRows(report)}
          totals={{
            totalDebit: report.total_debit,
            totalCredit: report.total_credit,
            closingBalance: report.closing_balance,
          }}
          tableFooter={
            <DataTablePagination
              meta={{
                page: report.page,
                page_size: pageSize,
                total: report.total_lines,
                total_pages: totalPages,
              }}
              onPageChange={setPage}
            />
          }
          emptyBody={null}
        />
      ) : (
        <StatementOfAccountTable
          header={{
            accountCode: null,
            accountName: null,
            from,
            to,
            pdcIncluded: false,
            previousBalanceIncluded: true,
            currencyCode: null,
          }}
          rows={[]}
          totals={null}
          emptyBody={
            !accountId ? (
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
                  <DataTableEmpty
                    title="No lines"
                    message="No posted activity for this account."
                  />
                </TableCell>
              </TableRow>
            ) : null
          }
        />
      )}
    </ReportShell>
  );
}
