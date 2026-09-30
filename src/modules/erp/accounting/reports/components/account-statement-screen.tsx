"use client";

import { useMemo, useState } from "react";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useAccountStatement } from "@/modules/erp/accounting/reports/queries";
import {
  sourceDocumentHref,
  type AccountStatementLine,
} from "@/modules/erp/accounting/reports/schemas";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ToolbarControl } from "@/shared/components/data-table/toolbar";
import { MasterSelect } from "@/shared/components/form/master-select";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatBalanceWithSide, formatDate, formatReportMoney } from "@/shared/lib/format";

const ALL = "all";
const COLUMN_COUNT = 8;

function lineDescription(line: AccountStatementLine | null | undefined): string {
  if (!line) {
    return "Select a row to view the description.";
  }
  return line.narration || line.description || line.external_reference || "—";
}

function lineKey(line: AccountStatementLine, index: number): string {
  return `${line.journal_entry_id ?? "pdc"}-${line.document_number}-${line.entry_date}-${index}`;
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  const selectedLine =
    selectedIndex != null && report ? (report.lines[selectedIndex] ?? null) : null;

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
  const hasFilters = Boolean(
    from ||
      to ||
      accountId ||
      partyId ||
      !includeOpening ||
      includePdc ||
      currencyId,
  );

  return (
    <ReportShell
      title="Account statement"
      subtitle="Ledger statement by account or party with optional PDC and opening balance"
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
              P.D.C included
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
          {hasFilters ? (
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
                    party_id: null,
                    party_type: null,
                    include_opening: null,
                    include_pdc: null,
                    currency_id: null,
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
          {report.account_code ? `${report.account_code} ${report.account_name}. ` : null}
          Opening {formatBalanceWithSide(report.opening_balance, report.opening?.balance_side, report.currency_code)}.
          Closing {formatBalanceWithSide(report.closing_balance, report.lines.at(-1)?.balance_side, report.currency_code)}.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vhr no.</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit/Allowance</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Cheque no.</TableHead>
              <TableHead>Clrg date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasScope ? (
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
            ) : (
              <>
                {report.opening && includeOpening ? (
                  <TableRow
                    className="bg-muted/40"
                    data-state={selectedIndex === -1 ? "selected" : undefined}
                    onClick={() => setSelectedIndex(-1)}
                  >
                    <TableCell>{formatDate(report.opening.entry_date)}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>OP</TableCell>
                    <TableCell>{money(report.opening.debit)}</TableCell>
                    <TableCell>{money(report.opening.credit)}</TableCell>
                    <TableCell>
                      {formatBalanceWithSide(
                        report.opening.running_balance,
                        report.opening.balance_side,
                        report.currency_code,
                      )}
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ) : null}
                {report.lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMN_COUNT}>
                      <DataTableEmpty
                        title="No lines"
                        message="No posted activity for this selection."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  report.lines.map((line, index) => (
                    <TableRow
                      key={lineKey(line, index)}
                      data-state={selectedIndex === index ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => setSelectedIndex(index)}
                    >
                      <TableCell>
                        {line.journal_entry_id ? (
                          <RecordLink
                            href={sourceDocumentHref(
                              line.source_type,
                              line.source_id,
                              line.journal_entry_id,
                            )}
                          >
                            {formatDate(line.entry_date)}
                          </RecordLink>
                        ) : (
                          formatDate(line.entry_date)
                        )}
                      </TableCell>
                      <TableCell>
                        {line.journal_entry_id ? (
                          <RecordLink href={`/journals/${line.journal_entry_id}`}>
                            {line.document_number}
                          </RecordLink>
                        ) : (
                          line.document_number
                        )}
                      </TableCell>
                      <TableCell>{line.voucher_code ?? "—"}</TableCell>
                      <TableCell>{money(line.debit)}</TableCell>
                      <TableCell>{money(line.credit)}</TableCell>
                      <TableCell>
                        {formatBalanceWithSide(
                          line.running_balance,
                          line.balance_side,
                          report.currency_code,
                        )}
                      </TableCell>
                      <TableCell>{line.cheque_number ?? "—"}</TableCell>
                      <TableCell>{formatDate(line.cheque_clearing_date)}</TableCell>
                    </TableRow>
                  ))
                )}
                {report.lines.length > 0 ? (
                  <>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell>{money(report.total_debit)}</TableCell>
                      <TableCell>{money(report.total_credit)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell colSpan={5}>Balance</TableCell>
                      <TableCell>
                        {formatBalanceWithSide(
                          report.closing_balance,
                          report.lines.at(-1)?.balance_side,
                          report.currency_code,
                        )}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </>
                ) : null}
              </>
            )}
          </TableBody>
        </DataTable>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border p-3 text-sm">
            <p className="mb-2 font-medium">Summary</p>
            <dl className="grid gap-1">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Total debit</dt>
                <dd>{money(report?.total_debit)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Total credit</dt>
                <dd>{money(report?.total_credit)}</dd>
              </div>
              <div className="flex justify-between gap-3 font-medium">
                <dt>Balance</dt>
                <dd>
                  {formatBalanceWithSide(
                    report?.closing_balance,
                    report?.lines.at(-1)?.balance_side,
                    report?.currency_code,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-medium">Description</p>
        <p className="text-muted-foreground text-sm">
          {selectedIndex === -1
            ? report?.opening?.description ?? "Opening balance"
            : lineDescription(selectedLine)}
        </p>
      </div>
    </ReportShell>
  );
}
