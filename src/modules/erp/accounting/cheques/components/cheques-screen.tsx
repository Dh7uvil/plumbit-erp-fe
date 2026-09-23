"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { chequeColumnDefs } from "@/modules/erp/accounting/cheques/components/cheque-columns";
import { useCheques } from "@/modules/erp/accounting/cheques/queries";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";

export function ChequesScreen() {
  const { canCreate, canRead, canUpdate } = useCrudPermissions(chequePermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const currenciesQuery = useAllCurrencies();
  const { baseCurrencyCode } = useBaseCurrency();
  const query = useCheques({
    page,
    page_size,
    search,
    status: filters.status,
    direction: filters.direction,
    due_date_from: filters.due_from,
    due_date_to: filters.due_to,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );
  const showActions = hasRowActions(canRead, canUpdate, false, false);

  const columnDefs = useMemo(
    () =>
      chequeColumnDefs({
        currencyCodeById,
        baseCurrencyCode,
        actions: showActions
          ? (cheque) => (
              <DataTableRowActions
                entityName={cheque.cheque_number}
                viewHref={canRead ? `/cheques/${cheque.id}` : undefined}
                editHref={
                  canUpdate && cheque.status === "DRAFT"
                    ? `/cheques/${cheque.id}/edit`
                    : undefined
                }
              />
            )
          : undefined,
      }),
    [baseCurrencyCode, canRead, canUpdate, currencyCodeById, showActions],
  );

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.cheques", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Cheques"
        subtitle="PDC register with issue, deposit, clear and bounce lifecycle."
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/cheques/new">
                <Plus className="size-3.5" />
                New cheque
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null, page: 1 })}
          placeholder="Search cheque number, party…"
        />
        <FilterSelect
          label="Status"
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "DRAFT", label: "Draft" },
            { value: "ISSUED", label: "Issued" },
            { value: "DEPOSITED", label: "Deposited" },
            { value: "CLEARED", label: "Cleared" },
            { value: "BOUNCED", label: "Bounced" },
          ]}
        />
        <FilterSelect
          label="Direction"
          className="w-44"
          placeholder="Direction"
          value={filters.direction ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { direction: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All directions" },
            { value: "INBOUND", label: "Inbound" },
            { value: "OUTBOUND", label: "Outbound" },
          ]}
        />
        <Button
          type="button"
          variant={filters.due === "pdc" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setParams({
              filters: {
                ...filters,
                due: filters.due === "pdc" ? null : "pdc",
                due_from:
                  filters.due === "pdc" ? null : new Date().toISOString().slice(0, 10),
              },
              page: 1,
            })
          }
        >
          PDC due view
        </Button>
        {columnsDialog}
        {search || filters.status || filters.direction || filters.due ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                filters: { status: null, direction: null, due: null, due_from: null, due_to: null },
                page: 1,
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columns} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No cheques"
                  message={emptyListMessage(canCreate, "Create a cheque to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <DataTableCells columns={columns} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
