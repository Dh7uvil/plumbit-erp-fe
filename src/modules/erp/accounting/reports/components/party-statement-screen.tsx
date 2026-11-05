"use client";

import { useMemo } from "react";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import {
  useCustomerStatement,
  useSupplierStatement,
} from "@/modules/erp/accounting/reports/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
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
import type { PartyStatement } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListFilterToolbar } from "@/shared/components/data-table/list-filter-toolbar";
import { documentDetailHref } from "@/shared/components/document/document-links";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { isZeroDecimal } from "@/shared/lib/format";
import { Download } from "lucide-react";

const ALL = "all";
const COLUMN_COUNT = 8;

function mapPartyStatementRows(report: PartyStatement): StatementOfAccountRow[] {
  return report.lines.map((line) => {
    const href = documentDetailHref(line.document_type, line.document_id);
    return {
      key: `${line.document_type}-${line.document_id}-${line.document_date}`,
      date: line.document_date,
      refNo: line.document_number,
      refHref: href,
      dateHref: href,
      typeCode: line.type_code ?? "—",
      debit: line.debit,
      credit: line.credit,
      runningBalance: line.running_balance,
      balanceSide: line.balance_side,
      chequeNumber: line.cheque_number,
      chequeDate: line.cheque_date,
    };
  });
}

export function PartyStatementScreen({ kind }: { kind: "customer" | "supplier" }) {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const partyId = kind === "customer" ? (filters.customer_id ?? "") : (filters.supplier_id ?? "");
  const includePdc = filters.include_pdc === "true";
  const includeOpening = filters.include_opening !== "false";
  const customersQuery = useAllCustomers(kind === "customer");
  const suppliersQuery = useAllSuppliers(kind === "supplier");
  const parties = kind === "customer" ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);
  const customerQuery = useCustomerStatement(
    kind === "customer" && partyId
      ? {
          customer_id: partyId,
          from,
          to,
          include_opening: includeOpening,
          include_pdc: includePdc,
        }
      : null,
  );
  const supplierQuery = useSupplierStatement(
    kind === "supplier" && partyId
      ? {
          supplier_id: partyId,
          from,
          to,
          include_opening: includeOpening,
          include_pdc: includePdc,
        }
      : null,
  );
  const reportQuery = kind === "customer" ? customerQuery : supplierQuery;
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const path = kind === "customer" ? "/reports/customer-statement" : "/reports/supplier-statement";
  const filename = kind === "customer" ? "customer-statement" : "supplier-statement";
  const partyKey = kind === "customer" ? "customer_id" : "supplier_id";
  const filterSpecs = useMemo((): FilterSpec[] => {
    return [
      {
        type: "option",
        key: partyKey,
        label: kind === "customer" ? "Customer" : "Supplier",
        options: parties.map((party) => ({ value: party.id, label: party.name })),
      },
      reportPeriodDateRangeSpec(),
      reportIncludePdcFlag(),
      reportExcludeOpeningFlag(),
    ];
  }, [kind, parties, partyKey]);

  function setParty(value: string) {
    setParams({
      filters:
        kind === "customer"
          ? { customer_id: value === ALL ? null : value }
          : { supplier_id: value === ALL ? null : value },
    });
  }

  const openingRow: StatementOfAccountRow | null =
    report && includeOpening && !isZeroDecimal(report.opening_balance)
      ? {
          key: "__opening__",
          date: report.from_date,
          refNo: "—",
          typeCode: "OP",
          debit: "0",
          credit: "0",
          runningBalance: report.opening_balance,
          balanceSide: report.opening_balance_side,
          description: "Previous balance",
        }
      : null;

  const emptyBody = !partyId ? (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT}>
        <DataTableEmpty
          title={kind === "customer" ? "Select a customer" : "Select a supplier"}
          message="Choose a party to load the statement."
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
        <DataTableEmpty title="No lines" message="No documents in this date range." />
      </TableCell>
    </TableRow>
  ) : null;

  const title =
    kind === "customer"
      ? report
        ? `Statement of account of ${report.party_name}`
        : "Customer statement"
      : report
        ? `Statement of account of ${report.party_name}`
        : "Supplier statement";

  return (
    <ListPage>
      <PageHeader
        title={title}
        subtitle="Document-level statement in org currency."
        actions={
          partyId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void downloadCsv(
                  path,
                  { [partyKey]: partyId, from, to, include_pdc: includePdc },
                  filename,
                );
              }}
              disabled={csvPending}
            >
              <Download className="size-4" />
              Download CSV
            </Button>
          ) : null
        }
      />
      <ListFilterToolbar filters={filters} specs={filterSpecs} setParams={setParams}>
        <FilterSelect
          label={kind === "customer" ? "Customer" : "Supplier"}
          className="w-64"
          placeholder={kind === "customer" ? "Customer" : "Supplier"}
          value={partyId || ALL}
          onValueChange={setParty}
          options={[
            { value: ALL, label: kind === "customer" ? "Select customer" : "Select supplier" },
            ...parties.map((party) => ({ value: party.id, label: party.name })),
          ]}
        />
        <DateRangeFilter
          layout="inline"
          fromId="party-stmt-from"
          toId="party-stmt-to"
          from={from}
          to={to}
          onFromChange={(value) => setParams({ filters: { from: value || null } })}
          onToChange={(value) => setParams({ filters: { to: value || null } })}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="party-stmt-pdc"
            checked={includePdc}
            onCheckedChange={(checked) =>
              setParams({ filters: { include_pdc: checked === true ? "true" : null } })
            }
          />
          <Label htmlFor="party-stmt-pdc" className="text-sm whitespace-nowrap">
            P.D.C Statement
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="party-stmt-opening"
            checked={includeOpening}
            onCheckedChange={(checked) =>
              setParams({
                filters: { include_opening: checked === true ? null : "false" },
              })
            }
          />
          <Label htmlFor="party-stmt-opening" className="text-sm whitespace-nowrap">
            Previous balance
          </Label>
        </div>
      </ListFilterToolbar>

      {report && partyId && !reportQuery.isLoading && !reportQuery.isError ? (
        <StatementOfAccountTable
          header={{
            accountCode: report.account_code ?? null,
            accountName: report.account_name ?? report.party_name,
            from: report.from_date,
            to: report.to_date,
            pdcIncluded: includePdc,
            previousBalanceIncluded: includeOpening,
            currencyCode: report.currency_code,
          }}
          openingRow={openingRow}
          rows={mapPartyStatementRows(report)}
          totals={{
            totalDebit: report.total_debit,
            totalCredit: report.total_credit,
            closingBalance: report.closing_balance,
            closingBalanceSide:
              report.closing_balance_side ?? report.lines.at(-1)?.balance_side,
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
    </ListPage>
  );
}
