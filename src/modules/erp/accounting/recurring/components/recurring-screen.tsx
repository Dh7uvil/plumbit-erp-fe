"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { useRecurringTemplates } from "@/modules/erp/accounting/recurring/queries";
import type { RecurringTemplate } from "@/modules/erp/accounting/recurring/schemas";
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
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate, humanizeEnum } from "@/shared/lib/format";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "next_run_date", label: "Next run" },
  { value: "status", label: "Status" },
] as const;
const RECURRING_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
const STATUS_LABELS = Object.fromEntries(
  RECURRING_STATUSES.map((status) => [status, humanizeEnum(status)]),
) as Record<(typeof RECURRING_STATUSES)[number], string>;
const STATUS_VARIANTS = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "muted",
  CANCELLED: "destructive",
} as const satisfies Record<
  (typeof RECURRING_STATUSES)[number],
  "success" | "warning" | "muted" | "destructive"
>;

function documentKindLabel(kind: string): string {
  return kind === "SALES_INVOICE" ? "Sales invoice" : "Purchase bill";
}

export function RecurringScreen() {
  const can = useCan();
  const { canCreate } = useCrudPermissions(recurringPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const templatesQuery = useRecurringTemplates({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: filters.status,
  });
  const rows = templatesQuery.data?.data ?? [];
  const meta = templatesQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<RecurringTemplate>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (row) => <RecordLink href={`/recurring/${row.id}`}>{row.name}</RecordLink>,
      },
      {
        id: "document_kind",
        header: "Document",
        cell: (row) => documentKindLabel(row.document_kind),
      },
      {
        id: "frequency",
        header: "Frequency",
        cell: (row) =>
          row.interval > 1
            ? `Every ${row.interval} ${humanizeEnum(row.frequency).toLowerCase()}`
            : humanizeEnum(row.frequency),
      },
      {
        id: "next_run_date",
        header: "Next run",
        sortableField: "next_run_date",
        cell: (row) => formatDate(row.next_run_date),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status as (typeof RECURRING_STATUSES)[number]}
            labels={STATUS_LABELS}
            variants={STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "occurrences",
        header: "Generated",
        defaultVisible: false,
        cell: (row) =>
          row.max_occurrences
            ? `${row.occurrences_generated} / ${row.max_occurrences}`
            : row.occurrences_generated,
      },
    ];
  }, []);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.recurring", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Recurring documents"
        subtitle="Schedules create draft invoices and bills. Nothing is posted automatically."
        actions={
          can(recurringPermissions.create) || canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/recurring/new">
                <Plus className="size-3.5" />
                New template
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search templates…"
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
            ...RECURRING_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
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
                filters: { status: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      >
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columns} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : templatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(templatesQuery.error)}
                  onRetry={() => templatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No templates"
                  message={emptyListMessage(canCreate, "Create a schedule to generate drafts.")}
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
