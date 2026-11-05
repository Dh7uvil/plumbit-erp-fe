"use client";

import { useMemo } from "react";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useAccountStatement } from "@/modules/erp/accounting/reports/queries";
import {
  sourceDocumentHref,
  type AccountStatement,
  type AccountStatementLine,
} from "@/modules/erp/accounting/reports/schemas";
import {
  StatementOfAccountTable,
  type StatementOfAccountRow,
} from "@/modules/erp/accounting/reports/components/statement-of-account-view";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import {
  reportExcludeOpeningFlag,
  reportIncludePdcFlag,
  reportPeriodDateRangeSpec,
} from "@/modules/erp/accounting/reports/components/report-filter-specs";
import { getErrorMessage } from "@/shared/api/errors";
import { AppliedFilterPills } from "@/shared/components/data-table/applied-filter-pills";
import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { MasterSelect } from "@/shared/components/form/master-select";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { documentDetailHref } from "@/shared/components/document/document-links";
import { isZeroDecimal } from "@/shared/lib/format";

const ALL = "all";
const COLUMN_COUNT = 8;

function lineKey(line: AccountStatementLine, index: number): string {
  return `${line.journal_entry_id ?? "pdc"}-${line.journal_line_number ?? "x"}-${line.document_number}-${line.entry_date}-${index}`;
}

function statementLineHref(line: AccountStatementLine): string | null {
  if (line.journal_entry_id) {
    return sourceDocumentHref(line.source_type, line.source_id, line.journal_entry_id);
  }
  if (line.source_id && line.source_type) {
    return documentDetailHref(line.source_type, line.source_id);
  }
  return null;
}

function mapAccountStatementRows(report: AccountStatement): StatementOfAccountRow[] {
  return report.lines.map((line, index) => {
    const href = statementLineHref(line);
    return {
    key: lineKey(line, index),
    date: line.entry_date,
    refNo: line.document_number,
    refHref: href,
    dateHref: href,
    typeCode: line.voucher_code ?? "—",
    debit: line.debit,
    credit: line.credit,
    runningBalance: line.running_balance,
    balanceSide: line.balance_side,
    chequeNumber: line.cheque_number,
    chequeDate: line.cheque_date,
    chequeClearingDate: line.cheque_clearing_date,
  };
  });
}

export function AccountStatementScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const accountId = filters.account_id ?? "";
  const partyType: "CUSTOMER" | "SUPPLIER" =
    filters.party_type === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
  const partyId = filters.party_id ?? "";
  const includeOpening = filters.include_opening !== "false";
  const includePdc = filters.include_pdc === "true";
  const currencyId = filters.currency_id;

  const accountsQuery = useAllAccounts({ is_group: false });
  const customersQuery = useAllCustomers(Boolean(partyId || !accountId));
  const suppliersQuery = useAllSuppliers(partyType === "SUPPLIER");
  const currenciesQuery = useAllCurrencies();
  const accounts = (accountsQuery.data ?? []).filter((row) => !row.is_group);
  const parties =
    partyType === "CUSTOMER" ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);
  const currencies = currenciesQuery.data ?? [];

  const reportParams =
    from && to && (accountId || partyId)
      ? {
          from,
          to,
          account_id: accountId || undefined,
          party_type: partyId ? partyType : undefined,
          party_id: partyId || undefined,
          include_opening: includeOpening,
          include_pdc: includePdc,
          currency_id: currencyId,
        }
      : null;

  const reportQuery = useAccountStatement(reportParams);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();

  const csvParams = useMemo(
    () => ({
      from,
      to,
      account_id: accountId || undefined,
      party_type: partyId ? partyType : undefined,
      party_id: partyId || undefined,
      include_opening: includeOpening,
      include_pdc: includePdc,
      currency_id: currencyId,
    }),
    [
      accountId,
      currencyId,
      from,
      includeOpening,
      includePdc,
      partyId,
      partyType,
      to,
    ],
  );

  const hasScope = Boolean(accountId || partyId);

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
      {
        type: "option",
        key: "party_type",
        label: "Party type",
        options: [
          { value: "CUSTOMER", label: "Customer" },
          { value: "SUPPLIER", label: "Supplier" },
        ],
      },
      {
        type: "option",
        key: "party_id",
        label: "Party",
        options: parties.map((party) => ({ value: party.id, label: party.name })),
      },
      reportPeriodDateRangeSpec(),
      {
        type: "option",
        key: "currency_id",
        label: "Currency",
        options: currencies.map((currency) => ({ value: currency.id, label: currency.code })),
      },
      reportIncludePdcFlag(),
      reportExcludeOpeningFlag(),
    ];
  }, [accounts, currencies, parties]);

  const openingRow: StatementOfAccountRow | null =
    report && includeOpening && !isZeroDecimal(report.opening_balance)
      ? {
          key: "__opening__",
          date: report.opening?.entry_date ?? report.from_date,
          refNo: "—",
          typeCode: "OP",
          debit: "0",
          credit: "0",
          runningBalance: report.opening_balance,
          balanceSide: report.opening?.balance_side ?? null,
        }
      : null;

  const emptyBody = !hasScope ? (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT}>
        <DataTableEmpty
          title="Select an account or party"
          message="Choose an account, or a customer or supplier, to load the statement."
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
  ) : !report ? (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT}>
        <DataTableEmpty title="No data" message="No statement data returned." />
      </TableCell>
    </TableRow>
  ) : report.lines.length === 0 && !openingRow ? (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT}>
        <DataTableEmpty title="No lines" message="No posted activity for this selection." />
      </TableCell>
    </TableRow>
  ) : null;

  return (
    <ReportShell
      title="Account statement"
      subtitle="Statement of account by ledger account or party"
      csvPending={csvPending}
      excelPending={excelPending}
      csvDisabled={!hasScope}
      onDownloadCsv={
        hasScope
          ? () => {
              void downloadCsv("/reports/account-statement", csvParams, "account-statement");
            }
          : undefined
      }
      onDownloadExcel={
        hasScope
          ? () => {
              void downloadExcel("/reports/account-statement", csvParams, "account-statement");
            }
          : undefined
      }
      toolbar={
        <>
          <ToolbarControl label="Account" htmlFor="stmt-account" className="min-w-[20ch]">
            <MasterSelect
              asFormControl={false}
              className="w-72"
              placeholder="Select account"
              searchPlaceholder="Search account…"
              aria-label="Account"
              value={accountId}
              onValueChange={(value) =>
                setParams({ filters: { account_id: value || null }, page: 1 })
              }
              options={accounts.map((account) => ({
                value: account.id,
                label: `${account.code} — ${account.name}`,
              }))}
            />
          </ToolbarControl>
          <FilterSelect
            label="Party type"
            className="w-36"
            placeholder="Party type"
            value={partyType}
            onValueChange={(value) =>
              setParams({
                filters: {
                  party_type: value === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER",
                  party_id: null,
                },
              })
            }
            options={[
              { value: "CUSTOMER", label: "Customer" },
              { value: "SUPPLIER", label: "Supplier" },
            ]}
          />
          <FilterSelect
            label="Party"
            className="w-56"
            placeholder="Party"
            value={partyId || ALL}
            onValueChange={(value) =>
              setParams({ filters: { party_id: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "Optional party" },
              ...parties.map((party) => ({ value: party.id, label: party.name })),
            ]}
          />
          <DateRangeFilter
            layout="inline"
            fromId="stmt-from"
            toId="stmt-to"
            from={from}
            to={to}
            onFromChange={(value) => setParams({ filters: { from: value || null } })}
            onToChange={(value) => setParams({ filters: { to: value || null } })}
          />
          <FilterSelect
            label="Currency"
            className="w-36"
            placeholder="Currency"
            value={currencyId ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { currency_id: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "Default" },
              ...currencies.map((currency) => ({ value: currency.id, label: currency.code })),
            ]}
          />
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              id="stmt-pdc"
              checked={includePdc}
              onCheckedChange={(checked) =>
                setParams({ filters: { include_pdc: checked === true ? "true" : null } })
              }
            />
            <Label htmlFor="stmt-pdc" className="text-sm whitespace-nowrap">
              P.D.C Statement
            </Label>
          </div>
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              id="stmt-opening"
              checked={includeOpening}
              onCheckedChange={(checked) =>
                setParams({
                  filters: { include_opening: checked === true ? null : "false" },
                })
              }
            />
            <Label htmlFor="stmt-opening" className="text-sm whitespace-nowrap">
              Previous balance
            </Label>
          </div>
        </>
      }
      activeFilters={
        <AppliedFilterPills filters={filters} specs={filterSpecs} setParams={setParams} />
      }
    >
      {report && hasScope && !reportQuery.isLoading && !reportQuery.isError ? (
        <StatementOfAccountTable
          header={{
            accountCode: report.account_code ?? null,
            accountName: report.account_name ?? null,
            from: report.from_date,
            to: report.to_date,
            pdcIncluded: includePdc,
            previousBalanceIncluded: includeOpening,
            currencyCode: report.currency_code,
          }}
          openingRow={openingRow}
          rows={mapAccountStatementRows(report)}
          totals={{
            totalDebit: report.total_debit,
            totalCredit: report.total_credit,
            closingBalance: report.closing_balance,
            closingBalanceSide: report.lines.at(-1)?.balance_side,
          }}
          emptyBody={emptyBody}
        />
      ) : (
        <StatementOfAccountTable
          header={{
            accountCode: null,
            accountName: null,
            from,
            to,
            pdcIncluded: includePdc,
            previousBalanceIncluded: includeOpening,
            currencyCode: null,
          }}
          rows={[]}
          totals={null}
          emptyBody={emptyBody}
        />
      )}
    </ReportShell>
  );
}
