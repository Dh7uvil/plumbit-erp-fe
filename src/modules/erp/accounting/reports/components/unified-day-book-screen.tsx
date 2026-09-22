"use client";

import { useMemo } from "react";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { DayBookRows } from "@/modules/erp/accounting/reports/components/cash-bank-book-screen";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useDayBook } from "@/modules/erp/accounting/reports/queries";
import {
  VOUCHER_ENTRY_TYPES,
  VOUCHER_TYPE_LABELS,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { MasterSelect } from "@/shared/components/form/master-select";
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
  { value: "cash_receipt_voucher", label: "Cash receipt voucher" },
  { value: "cash_payment_voucher", label: "Cash payment voucher" },
  { value: "bank_receipt_voucher", label: "Bank receipt voucher" },
  { value: "bank_payment_voucher", label: "Bank payment voucher" },
  { value: "voucher_allocation", label: "Voucher allocation" },
  { value: "goods_receipt", label: "Goods receipt" },
  { value: "delivery_note", label: "Delivery note" },
  { value: "sales_return", label: "Sales return" },
  { value: "purchase_return", label: "Purchase return" },
  { value: "landed_cost", label: "Landed cost" },
  { value: "stock_adjustment", label: "Stock adjustment" },
  { value: "OPENING_BALANCE", label: "Opening balance" },
  { value: "INVENTORY_CATCH_UP", label: "Inventory catch-up" },
];

export function UnifiedDayBookScreen() {
  const can = useCan();
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const accountId = filters.account_id;
  const partyId = filters.party_id;
  const branchId = filters.branch_id;
  const costCenterId = filters.cost_center_id;
  const sourceType = filters.source_type;
  const voucherType = filters.voucher_type;
  const side = filters.side;
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const customersQuery = useAllCustomers();
  const suppliersQuery = useAllSuppliers();
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const costCentersQuery = useAllCostCenters(can("masters.cost_center.read"));
  const reportParams =
    from && to
      ? {
          from,
          to,
          account_id: accountId,
          party_id: partyId,
          branch_id: branchId,
          cost_center_id: costCenterId,
          source_type: sourceType,
          voucher_type: voucherType,
          side,
        }
      : null;
  const reportQuery = useDayBook(reportParams);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const csvParams = {
    from,
    to,
    account_id: accountId,
    party_id: partyId,
    branch_id: branchId,
    cost_center_id: costCenterId,
    source_type: sourceType,
    voucher_type: voucherType,
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
  const partyOptions = [
    ...(customersQuery.data ?? []).map((row) => ({
      value: row.id,
      label: `Customer · ${row.name}`,
    })),
    ...(suppliersQuery.data ?? []).map((row) => ({
      value: row.id,
      label: `Supplier · ${row.name}`,
    })),
  ];

  return (
    <ReportShell
      title="Day book"
      subtitle="All-accounts register with opening balances, movements, and closing balances"
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/day-book", csvParams, "day-book");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/day-book", csvParams, "day-book");
      }}
      toolbar={
        <>
          <ToolbarControl label="Account" htmlFor="day-book-account" className="min-w-[20ch]">
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
                ...(accountsQuery.data ?? []).map((account) => ({
                  value: account.id,
                  label: `${account.code} — ${account.name}`,
                })),
              ]}
            />
          </ToolbarControl>
          <ToolbarControl label="Party" htmlFor="day-book-party" className="min-w-[20ch]">
            <MasterSelect
              asFormControl={false}
              className="w-72"
              placeholder="All parties"
              searchPlaceholder="Search party…"
              aria-label="Party"
              value={partyId ?? ALL}
              onValueChange={(value) =>
                setParams({ filters: { party_id: value === ALL ? null : value } })
              }
              options={[{ value: ALL, label: "All parties" }, ...partyOptions]}
            />
          </ToolbarControl>
          <DateRangeFilter
            layout="inline"
            fromId="day-book-from"
            toId="day-book-to"
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
            label="Voucher"
            className="w-44"
            placeholder="Voucher type"
            value={voucherType ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { voucher_type: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All vouchers" },
              ...VOUCHER_ENTRY_TYPES.map((type) => ({
                value: type,
                label: VOUCHER_TYPE_LABELS[type],
              })),
            ]}
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
              ...(branchesQuery.data ?? []).map((branch) => ({
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
              ...(costCentersQuery.data ?? []).map((row) => ({
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
                <DataTableEmpty
                  title="No activity"
                  message="No posted ledger lines in this period."
                />
              </TableCell>
            </TableRow>
          ) : (
            <DayBookRows lines={displayLines} money={money} showAccount={showAccountColumn} />
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
