"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { useCostSheets } from "@/modules/erp/cost-sheets/queries";
import {
  COST_SHEET_STATUS_LABELS,
  COST_SHEET_STATUSES,
  type CostSheet,
  type CostSheetStatus,
} from "@/modules/erp/cost-sheets/schemas";
import { documentTypeDisplayLabel } from "@/shared/components/document/document-links";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const ALL = "all";

function parseStatus(value: string | undefined): CostSheetStatus | undefined {
  return COST_SHEET_STATUSES.includes(value as CostSheetStatus)
    ? (value as CostSheetStatus)
    : undefined;
}

export function CostSheetsScreen() {
  const { canCreate, canRead } = useCrudPermissions(costSheetPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const listQuery = useCostSheets({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });

  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<CostSheet>> => {
    return [
      {
        id: "document_number",
        header: "Voucher no.",
        sortableField: "document_number",
        cell: (row) => (
          <RecordLink href={`/cost-sheets/${row.id}/edit`}>{row.document_number}</RecordLink>
        ),
      },
      {
        id: "source_document_type",
        header: "Document type",
        cell: (row) =>
          row.source_document_type
            ? documentTypeDisplayLabel(row.source_document_type)
            : "—",
      },
      {
        id: "source_document_number",
        header: "Document no.",
        cell: (row) => row.source_document_number ?? "—",
      },
      {
        id: "period",
        header: "Period",
        cell: (row) => (row.period != null ? String(row.period) : "—"),
      },
      {
        id: "document_date",
        header: "Date",
        sortableField: "document_date",
        cell: (row) => formatDate(row.document_date),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => <Badge variant="outline">{COST_SHEET_STATUS_LABELS[row.status]}</Badge>,
      },
    ];
  }, []);

  const { columns, colSpan } = useTableColumns("erp.cost_sheets", columnDefs);

  if (!canRead) {
    return null;
  }

  return (
    <ListPage>
      <PageHeader
        title="Cost sheet entry"
        actions={
          canCreate ? (
            <Button size="sm" asChild>
              <Link href="/cost-sheets/entry">
                <Plus className="mr-2 h-4 w-4" />
                New entry
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search cost sheets…"
        />
        <FilterSelect
          label="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({
              filters: { ...filters, status: value === ALL ? undefined : value },
              page: 1,
            })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...COST_SHEET_STATUSES.map((status) => ({
              value: status,
              label: COST_SHEET_STATUS_LABELS[status],
            })),
          ]}
        />
        <DateRangeFilter
          from={filters.document_date_from ?? ""}
          to={filters.document_date_to ?? ""}
          onFromChange={(value) =>
            setParams({ filters: { ...filters, document_date_from: value || undefined }, page: 1 })
          }
          onToChange={(value) =>
            setParams({ filters: { ...filters, document_date_to: value || undefined }, page: 1 })
          }
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : listQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(listQuery.error)}
                  onRetry={() => listQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No cost sheets"
                  message="Create a journal cost sheet linked to a source document."
                  action={
                    canCreate ? (
                      <Button size="sm" asChild>
                        <Link href="/cost-sheets/entry">New entry</Link>
                      </Button>
                    ) : undefined
                  }
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
