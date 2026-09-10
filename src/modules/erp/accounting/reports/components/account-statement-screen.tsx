"use client";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAccountStatement } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const ALL = "all";
const COLUMN_COUNT = 7;

export function AccountStatementScreen() {
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const partyType = filters.party_type === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
  const partyId = filters.party_id ?? "";
  const customersQuery = useAllCustomers(partyType === "CUSTOMER");
  const suppliersQuery = useAllSuppliers(partyType === "SUPPLIER");
  const parties = partyType === "CUSTOMER" ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);
  const reportQuery = useAccountStatement(
    partyId && from && to ? { party_type: partyType, party_id: partyId, from, to } : null,
  );
  const report = reportQuery.data;

  return (
    <ListPage>
      <PageHeader title="Account statement" subtitle="Open-item view over AR/AP control accounts" />
      <DataTableToolbar>
        <FilterSelect
          className="w-44"
          placeholder="Party type"
          aria-label="Party type"
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
          className="w-64"
          placeholder="Party"
          aria-label="Party"
          value={partyId || ALL}
          onValueChange={(value) =>
            setParams({ filters: { party_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "Select party" },
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
        {from || to || partyId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() =>
              setParams({
                filters: { from: null, to: null, party_id: null, party_type: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      {report ? (
        <p className="text-muted-foreground text-sm">
          Opening {formatDecimal(report.opening_balance)}. Closing{" "}
          {formatDecimal(report.closing_balance)}.
        </p>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Running</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!partyId || !from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select a party and dates"
                  message="Choose a customer or supplier and a date range."
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
                <DataTableEmpty title="No lines" message="No posted activity for this party." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line, index) => (
              <TableRow key={`${line.journal_entry_id}-${index}`}>
                <TableCell>{formatDate(line.entry_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/journals/${line.journal_entry_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>{formatDate(line.due_date)}</TableCell>
                <TableCell>{line.external_reference ?? "—"}</TableCell>
                <TableCell>{formatDecimal(line.debit)}</TableCell>
                <TableCell>{formatDecimal(line.credit)}</TableCell>
                <TableCell>{formatDecimal(line.running_balance)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
