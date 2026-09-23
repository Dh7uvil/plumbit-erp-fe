"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { budgetPermissions } from "@/modules/erp/accounting/budgets/permissions";
import { useBudgets } from "@/modules/erp/accounting/budgets/queries";
import type { Budget } from "@/modules/erp/accounting/budgets/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { Button } from "@/shared/components/ui/button";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { humanizeEnum } from "@/shared/lib/format";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "fiscal_year", label: "Fiscal year" },
  { value: "status", label: "Status" },
] as const;
const BUDGET_STATUSES = ["DRAFT", "ACTIVE", "CLOSED"] as const;
const STATUS_LABELS = Object.fromEntries(
  BUDGET_STATUSES.map((status) => [status, humanizeEnum(status)]),
) as Record<(typeof BUDGET_STATUSES)[number], string>;
const STATUS_VARIANTS = {
  DRAFT: "warning",
  ACTIVE: "success",
  CLOSED: "muted",
} as const satisfies Record<(typeof BUDGET_STATUSES)[number], "warning" | "success" | "muted">;

export function BudgetsScreen() {
  const can = useCan();
  const { canCreate } = useCrudPermissions(budgetPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const budgetsQuery = useBudgets({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: filters.status,
    fiscal_year: filters.fiscal_year ? Number(filters.fiscal_year) : undefined,
  });
  const rows = budgetsQuery.data?.data ?? [];
  const meta = budgetsQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<Budget>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (budget) => <RecordLink href={`/budgets/${budget.id}`}>{budget.name}</RecordLink>,
      },
      {
        id: "fiscal_year",
        header: "Fiscal year",
        sortableField: "fiscal_year",
        cell: (budget) => budget.fiscal_year,
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (budget) => (
          <DocumentStatusBadge
            status={budget.status as (typeof BUDGET_STATUSES)[number]}
            labels={STATUS_LABELS}
            variants={STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "lines",
        header: "Lines",
        defaultVisible: false,
        cell: (budget) => budget.lines.length,
      },
    ];
  }, []);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.budgets", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Budgets"
        subtitle="Plans by account and period. Activating a budget does not post journals."
        actions={
          can(budgetPermissions.create) || canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/budgets/new">
                <Plus className="size-3.5" />
                New budget
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search budgets…"
        />
        <FilterSelect
          label="Status"
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...BUDGET_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
          ]}
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.status || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { status: null, fiscal_year: null },
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
          {budgetsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : budgetsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(budgetsQuery.error)}
                  onRetry={() => budgetsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No budgets"
                  message={emptyListMessage(canCreate, "Create a budget to compare with the ledger.")}
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
